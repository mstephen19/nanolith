import { createSharedArrayBuffer, encodeValue, isSharedArrayPair } from './utilities.js';
import * as Keys from './keys.js';

import type { Key, SharedArrayPair } from '../types/shared_map.js';
import { type CleanKeyOf } from '../types/utilities.js';

export class SharedMap<Data extends Record<string, any>> {
    // SharedArrayBuffer containing all keys in bytes
    #keys: Uint8Array;
    // SharedArrayBuffer containing all concatenated values in bytes
    #values: Uint8Array;
    // Instantiate an encoder and decoder once to avoid the
    // need for constantly instantiating them.
    #encoder = new TextEncoder();
    #decoder = new TextDecoder();

    get pair(): SharedArrayPair<Data> {
        return Object.freeze({
            keys: this.#keys,
            values: this.#values,
        });
    }

    constructor(data: Data, multiplier?: number);
    constructor(pair: SharedArrayPair<Data>);
    constructor(data: Data extends SharedArrayPair<infer Type> ? Type : Data, multiplier = 10) {
        if (isSharedArrayPair(data)) {
            this.#keys = data.keys;
            this.#values = data.values;
        }

        const entries = Object.entries(data);

        // Encode each value, then determine what its indexes will be based on a tracked
        // total length of values +
        const { preppedKeys, preppedValues, totalLength } = entries.reduce(
            (result, [itemKey, itemValue]) => {
                // Prepare the data by encoding it
                const encodedData = encodeValue(this.#encoder, itemValue);
                // Bugs occur when 0 byte strings are passed in. They need to be disallowed.
                if (encodedData.byteLength <= 0) throw new Error('Cannot provide empty data to SharedMap!');

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
        this.#keys.set(encodedKeys);

        // Create an array buffer for values and
        this.#values = createSharedArrayBuffer(totalLength * multiplier);
        preppedValues.reduce((offset, array) => {
            this.#values.set(array, offset);
            offset += array.byteLength;
            return offset;
        }, 0);
    }

    get<KeyName extends CleanKeyOf<Data>>(name: KeyName) {
        const decodedKeys = this.#decoder.decode(this.#keys);
        const match = Keys.matchKey(decodedKeys, name);
        if (!match) return null;

        const { start, end } = Keys.parseKey(match as Key);
        if (start === undefined || end === undefined) throw new Error('Failed to parse key');

        return this.#decoder.decode(this.#values.slice(start, end + 1));
    }

    set<KeyName extends CleanKeyOf<Data>>(name: KeyName, value: Data[KeyName]) {
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
        const encodedValue = this.#encoder.encode(value);

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
    }
}