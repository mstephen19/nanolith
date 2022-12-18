import { createSharedArrayBuffer, encodeValue, isSharedMapTransferData, sleep } from './utilities.js';
import * as Keys from './keys.js';
import { BusyStatus, Bytes } from '../types/shared_map.js';
import { NULL_ENCODED } from './constants.js';

import type { Key, SharedMapTransferData, SharedMapOptions } from '../types/shared_map.js';
import type { CleanKeyOf } from '../types/utilities.js';

/**
 * A highly approachable solution to sharing memory between multiple threads 💾
 *
 * 💥 **Note:** Does not act exactly the same way as the {@link Map} object!
 */
export class SharedMap<Data extends Record<string, any>> {
    // SharedArrayBuffer containing all keys in bytes
    #keys: Uint8Array;
    // SharedArrayBuffer containing all concatenated values in bytes
    #values: Uint8Array;
    // A cheap "mutex" that is used to ensure only one operation occurs
    // on the shared map at a single time
    #status: Uint8Array;
    // Instantiate an encoder and decoder once to avoid the
    // need for constantly instantiating them.
    #encoder = new TextEncoder();
    #decoder = new TextDecoder();

    /**
     * An `enum` designed to help you when assigning a fixed byte size
     * for the map's values.
     */
    static readonly option = Bytes;

    get transfer(): SharedMapTransferData<Data> {
        return Object.freeze({
            __keys: this.#keys,
            __values: this.#values,
            __status: this.#status,
        });
    }

    constructor(data: Data, options?: SharedMapOptions);
    constructor(pair: SharedMapTransferData<Data>);
    constructor(
        data: Data extends SharedMapTransferData<infer Type> ? Type : Data,
        { bytes: bytesOption, multiplier = 10 } = {} as SharedMapOptions
    ) {
        if (isSharedMapTransferData(data)) {
            this.#keys = data.__keys;
            this.#values = data.__values;
            this.#status = data.__status;
            return;
        }

        const entries = Object.entries(data);

        // Encode each value, then determine what its indexes will be based on a tracked
        // total length of values +
        const { preppedKeys, preppedValues, totalLength } = entries.reduce(
            (result, [itemKey, itemValue]) => {
                // Prepare the data by encoding it
                let encodedData = encodeValue(this.#encoder, itemValue);
                // Bugs occur when 0 byte strings are passed in. Pass in null as the default instead.
                // This handles the cases when empty strings are passed in.
                if (encodedData.byteLength <= 0) encodedData = NULL_ENCODED;

                const endIndex = encodedData.byteLength - 1 + result.totalLength;

                // Create a key for the data so that it can be retrieved later on based on its indexes
                const key = Keys.createKey({ name: itemKey, start: result.totalLength, end: endIndex });

                result.preppedKeys.push(key);
                result.preppedValues.push(encodedData);

                result.totalLength += encodedData.byteLength;

                return result;
            },
            { preppedKeys: [], preppedValues: [], totalLength: 0 } as {
                preppedKeys: Key[];
                preppedValues: Uint8Array[];
                totalLength: number;
            }
        );

        // Encode keys and create an array buffer for them, populating it.
        const encodedKeys = this.#encoder.encode(preppedKeys.join());
        this.#keys = createSharedArrayBuffer(encodedKeys.byteLength * multiplier);
        // It is safe to use no sort of mutex at this stage, because the arrays are just being
        // initialized and the constructor has not even returned yet
        this.#keys.set(encodedKeys);

        if (bytesOption && bytesOption < totalLength) {
            throw new Error(`${bytesOption} isn't enough bytes to store all values. Total byteLength of values is ${totalLength}.`);
        }

        // Create an array buffer for values and
        this.#values = createSharedArrayBuffer(bytesOption || totalLength * multiplier);
        preppedValues.reduce((offset, array) => {
            this.#values.set(array, offset);
            offset += array.byteLength;
            return offset;
        }, 0);

        // Initialize the status array buffer with the "Free" status
        this.#status = createSharedArrayBuffer(1);
        this.#status.set([BusyStatus.Free]);
    }

    async #wait(): Promise<void> {
        // Return once the status is Free
        if (Atomics.load(this.#status, 0) === BusyStatus.Free) return;
        // Otherwise, wait half a second and then check again
        await sleep(500);
        return this.#wait();
    }

    async #run<ReturnValue>(workflow: () => ReturnValue): Promise<Awaited<ReturnValue>> {
        // Wait for the map to not be busy.
        // ! This method is absolutely not foolproof, but it will prevent most
        // ! race conditions when not making too many queries on the map. This
        // ! is simply preventative.
        await this.#wait();

        Atomics.store(this.#status, 0, BusyStatus.Busy);
        const data = await workflow();
        Atomics.store(this.#status, 0, BusyStatus.Free);

        // Return out the return value, if any
        return data;
    }

    /**
     * Retrieve items on the {@link SharedMap}.
     *
     * @param name The name of the key to retrieve the corresponding value of
     * @returns A string that can be converted back into the original data type
     */
    get<KeyName extends CleanKeyOf<Data extends SharedMapTransferData<infer Type> ? Type : Data>>(name: KeyName) {
        return this.#run(() => {
            const decodedKeys = this.#decoder.decode(this.#keys);
            const match = Keys.matchKey(decodedKeys, name);
            if (!match) return null;

            const { start, end } = Keys.parseKey(match as Key);
            if (start === undefined || end === undefined) throw new Error('Failed to parse key');

            return this.#decoder.decode(this.#values.slice(start, end + 1));
        });
    }

    /**
     * Set new values for items on the {@link SharedMap}.
     *
     * @param name The name of the key to set. The key **must** already exist on the map.
     * @param value The new value for the key.
     */
    set<KeyName extends CleanKeyOf<Data extends SharedMapTransferData<infer Type> ? Type : Data>>(name: KeyName, value: Data[KeyName]) {
        return this.#run(() => {
            const decodedKeys = this.#decoder.decode(this.#keys).replace(/\x00/g, '');

            // Disallow the setting of keys that don't already exist
            if (!Keys.createKeyRegex(name).test(decodedKeys)) {
                throw new Error(`The key "${name}" doesn't exist on this SharedMap!`);
            }

            // The final index in the values array where there is data. Anything
            // beyond this point is just x00
            const finalPosition = decodedKeys.match(/\d+(?=\);($|\x00))/g)?.[0];
            // The key
            const match = Keys.matchKey(decodedKeys, name);
            if (!match || !finalPosition) throw new Error('Failed to parse keys.');

            /* Update value */
            const { start: valueStart, end: previousValueEnd } = Keys.parseKey(match);
            const previousValueByteLength = previousValueEnd - valueStart + 1;
            let encodedValue = this.#encoder.encode(value);
            // Handle when the user tries to pass in an empty string when setting a value
            if (encodedValue.byteLength <= 0) encodedValue = NULL_ENCODED;

            // If the byteLength of the data provided is the same as the byteLength of
            // the data that already exists, we don't need to do any index shifting and
            // can just replace the data without doing magic with keys.
            if (previousValueByteLength === encodedValue.byteLength) {
                this.#values.set(encodedValue, valueStart);
                return;
            }

            const valueEnd = valueStart + encodedValue.byteLength;

            // If we aren't modifying the final value, rewrite the old data to the new offset so
            // it's not nastily overwritten
            if (previousValueEnd !== +finalPosition) {
                const slice = this.#values.slice(previousValueEnd + 1, +finalPosition + 1);
                this.#values.set(slice, valueEnd);
            }

            this.#values.set(encodedValue, valueStart);

            /* Update keys */
            const keysArray = decodedKeys.split(/(?<=;)/g) as Key[];
            const targetKeyIndex = keysArray.findIndex((item) => Keys.createKeyRegex(name).test(item));
            const newTargetKey = Keys.createKey({ name, start: valueStart, end: valueEnd - 1 });

            // Replace the old targeted key with a new one updated with the new indexes
            keysArray.splice(targetKeyIndex, 1, newTargetKey);

            // Each key after the target key must also be updated
            for (let i = targetKeyIndex + 1; i < keysArray.length; i++) {
                const { name, start: previousStart, end: previousEnd } = Keys.parseKey(keysArray[i]);
                const byteLength = previousEnd - previousStart + 1;

                // Calculate where the key should now start and where it should end
                const start = previousStart - previousValueByteLength + encodedValue.byteLength;
                const end = start + byteLength - 1;

                // Replace the old key with the updated one
                keysArray.splice(i, 1, Keys.createKey({ name, start, end }));
            }

            let updatedKeys = keysArray.join('');

            // We don't want garbage lingering data, so add "empty" bytes
            // for any extra lingering positions in case the keys string is
            // now shorter than what it was previously
            if (updatedKeys.length < decodedKeys.length) {
                updatedKeys += '\x00'.repeat(decodedKeys.length - updatedKeys.length);
            }

            this.#keys.set(this.#encoder.encode(updatedKeys));
        });
    }
}
