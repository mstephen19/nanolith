import { randomUUID as v4 } from 'crypto';
import { createSharedArrayBuffer, encodeValue, isSharedMapRawData } from './utilities.js';
import * as Keys from './keys.js';
import { Bytes, NULL_ENCODED, ENCODER, DECODER } from '@constants/shared_map.js';
import { createMutex, lockMutex, unlockMutex } from '@utilities';

import type { Key, SharedMapRawData, SharedMapOptions, SetWithPreviousHandler } from '@typing/shared_map.js';
import type { Mutex } from '@utilities';
import type { CleanKeyOf } from '@typing/utilities.js';

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
    #mutex: Mutex;
    #key = v4();
    // The identifier for the BroadcastChannel used for coordinating the queue
    #identifier: string;

    /**
     * Each {@link SharedMap} instance has a unique key that can be used
     * to identify it.
     */
    get uniqueKey() {
        return this.#key;
    }

    /**
     * A single ID assigned to the entire group of SharedMap instances using the
     * shared memory buffers.
     */
    get ID() {
        return this.#identifier;
    }

    /**
     * An enum designed to help with assigning a fixed byte size
     * for the map's values.
     */
    static readonly option = Bytes;

    /**
     * An enum designed to help with assigning a fixed byte size
     * for the map's values.
     */
    readonly option = Bytes;

    get raw(): SharedMapRawData<Data> {
        return Object.freeze({
            __keys: this.#keys,
            __values: this.#values,
            __identifier: this.#identifier,
            __mutex: this.#mutex,
        });
    }

    constructor(data: Data, options?: SharedMapOptions);
    constructor(pair: SharedMapRawData<Data>);
    constructor(
        data: Data extends SharedMapRawData<infer Type> ? Type : Data,
        { bytes: bytesOption, multiplier = 10 } = {} as SharedMapOptions
    ) {
        if (typeof data !== 'object') {
            throw new Error('Can only provide objects to SharedMap.');
        }

        if (isSharedMapRawData(data)) {
            this.#keys = data.__keys;
            this.#values = data.__values;
            this.#identifier = data.__identifier;
            this.#mutex = data.__mutex;
            return;
        }

        const entries = Object.entries(data);

        // Encode each value, then determine what its indexes will be based on a tracked
        // total length of values +
        const { preppedKeys, preppedValues, totalLength } = entries.reduce(
            (result, [itemKey, itemValue]) => {
                // Prepare the data by encoding it
                let encodedData = encodeValue(ENCODER, itemValue);
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
        const encodedKeys = ENCODER.encode(preppedKeys.join());
        // If the encoded keys length * the multiplier is zero, default to 1kb
        this.#keys = createSharedArrayBuffer(encodedKeys.byteLength * multiplier || Bytes.kilobyte);
        // It is safe to use no sort of mutex at this stage, because the arrays are just being
        // initialized and the constructor has not even returned yet
        this.#keys.set(encodedKeys);

        if (bytesOption && bytesOption < totalLength) {
            throw new Error(`${bytesOption} isn't enough bytes to store all values. Total byteLength of values is ${totalLength}.`);
        }

        // Create an array buffer for values and
        // If no bytes option is provided and the totalLength * multiplier is zero, default to 3kb.
        this.#values = createSharedArrayBuffer(bytesOption || totalLength * multiplier || Bytes.kilobyte * 3);
        preppedValues.reduce((offset, array) => {
            this.#values.set(array, offset);
            offset += array.byteLength;
            return offset;
        }, 0);

        // Now we can set up the orchestrator queuing system
        this.#identifier = v4();

        this.#mutex = createMutex();
    }

    async #run<ReturnValue>(workflow: () => ReturnValue): Promise<Awaited<ReturnValue>> {
        // Wait for the mutex to be unlocked, then lock it
        await lockMutex(this.#mutex);

        // Run the workflow
        const data = await workflow();

        // Unlock the mutex when we're done
        unlockMutex(this.#mutex);

        // Return out the return value, if any
        return data;
    }

    #getKey<KeyName extends CleanKeyOf<Data extends SharedMapRawData<infer Type> ? Type : Data>>(name: KeyName) {
        const decodedKeys = DECODER.decode(this.#keys);
        const match = Keys.matchKey(decodedKeys, name);
        if (!match) return null;
        return match;
    }

    #get<KeyName extends CleanKeyOf<Data extends SharedMapRawData<infer Type> ? Type : Data>>(name: KeyName) {
        const match = this.#getKey(name);
        if (!match) return null;

        const { start, end } = Keys.parseKey(match as Key);
        if (start === undefined || end === undefined) throw new Error('Failed to parse key');

        const decoded = DECODER.decode(this.#values.subarray(start, end + 1));

        if (decoded === 'null') return null;
        return decoded;
    }

    /**
     * Retrieve items on the {@link SharedMap}.
     *
     * @param name The name of the key to retrieve the corresponding value of
     * @returns A string that can be converted back into the original data type
     */
    get<KeyName extends CleanKeyOf<Data extends SharedMapRawData<infer Type> ? Type : Data>>(name: KeyName) {
        return this.#run(() => {
            return this.#get(name);
        });
    }

    #set<KeyName extends CleanKeyOf<Data extends SharedMapRawData<infer Type> ? Type : Data>>(name: KeyName, value: Data[KeyName]) {
        const decodedKeys = DECODER.decode(this.#keys).replace(/\x00/g, '');

        // The final index in the values array where there is data. Anything
        // beyond this point is just x00
        const finalPosition = decodedKeys.match(/\d+(?=\);($|\x00))/g)?.[0];

        let encodedValue = encodeValue(ENCODER, value);
        // Handle when the user tries to pass in an empty string when setting a value
        if (encodedValue.byteLength <= 0) encodedValue = NULL_ENCODED;

        // If the key doesn't yet exist, we just need to append it to the end.
        if (!finalPosition || !Keys.createKeyRegex(name).test(decodedKeys)) {
            // If the map is empty, there will be no final position and we need to add the
            // first item.
            const start = !finalPosition ? 0 : +finalPosition + 1;
            const end = start + encodedValue.byteLength - 1;
            const newKey = Keys.createKey({ name, start, end });
            this.#keys.set(ENCODER.encode(decodedKeys.concat(newKey)));
            this.#values.set(encodedValue, start);
            return encodedValue;
        }

        // The key we are trying to change.
        const match = Keys.matchKey(decodedKeys, name);
        if (!match) throw new Error('Failed to parse keys.');

        /* Update value */
        const { start: valueStart, end: previousValueEnd } = Keys.parseKey(match);
        const previousValueByteLength = previousValueEnd - valueStart + 1;

        // If the byteLength of the data provided is the same as the byteLength of
        // the data that already exists, we don't need to do any index shifting and
        // can just replace the data without doing magic with keys.
        if (previousValueByteLength === encodedValue.byteLength) {
            this.#values.set(encodedValue, valueStart);
            return encodedValue;
        }

        const valueEnd = valueStart + encodedValue.byteLength;

        // If we aren't modifying the final value, rewrite the old data to the new offset so
        // it's not nastily overwritten
        if (previousValueEnd !== +finalPosition) {
            // ? Potentially use .subarray here instead?
            const slice = this.#values.subarray(previousValueEnd + 1, +finalPosition + 1);
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

        this.#keys.set(ENCODER.encode(updatedKeys));

        return encodedValue;
    }

    /**
     * Set new values for existing items on the {@link SharedMap}.
     *
     * @param name The name of the key to set. The key **must** already exist on the map.
     * @param value The new value for the key.
     */
    set<KeyName extends CleanKeyOf<Data extends SharedMapRawData<infer Type> ? Type : Data>>(
        name: KeyName,
        handler: SetWithPreviousHandler<
            Data extends SharedMapRawData<infer Type> ? (KeyName extends keyof Type ? Type[KeyName] : Data[KeyName]) : Data[KeyName]
        >
    ): Promise<void>;
    set<KeyName extends CleanKeyOf<Data extends SharedMapRawData<infer Type> ? Type : Data>>(
        name: KeyName,
        value: Data extends SharedMapRawData<infer Type>
            ? KeyName extends keyof Type
                ? Type[KeyName]
                : Data[KeyName]
            :
                  | Data[KeyName]
                  | SetWithPreviousHandler<
                        Data extends SharedMapRawData<infer Type>
                            ? KeyName extends keyof Type
                                ? Type[KeyName]
                                : Data[KeyName]
                            : Data[KeyName]
                    >
    ): Promise<void>;
    set<KeyName extends CleanKeyOf<Data extends SharedMapRawData<infer Type> ? Type : Data>>(
        name: KeyName,
        value: Data extends SharedMapRawData<infer Type> ? (KeyName extends keyof Type ? Type[KeyName] : Data[KeyName]) : Data[KeyName]
    ) {
        return this.#run(async () => {
            const newValue = typeof value !== 'function' ? value : await value(this.#get(name));
            this.#set(name, newValue);
        });
    }

    /**
     * Delete a key on the {@link SharedMap} instance.
     *
     * **Note:** Does not actually delete the key. Just sets it to "null".
     *
     * @param key The name of the key to delete.
     */
    async delete<KeyName extends CleanKeyOf<Data extends SharedMapRawData<infer Type> ? Type : Data>>(name: KeyName) {
        return this.#run(() => {
            // Do nothing if there is no match
            const match = this.#getKey(name);
            if (!match) return;

            return this.#set(name, null as Data[KeyName]);
        });
    }
}
