import { randomUUID as v4 } from 'crypto';
import { createSharedArrayBuffer, encodeValue, isSharedMapTransferData } from './utilities.js';
import * as Keys from './keys.js';
import { Bytes } from '@constants/shared_map.js';
import { BroadcastChannelEmitter } from './broadcast_channel_emitter.js';

import type { Key, SharedMapTransferData, SharedMapOptions, SharedMapBroadcastChannelEvents } from '@typing/shared_map.js';
import type { CleanKeyOf } from '@typing/utilities.js';

const NULL_ENCODED = encodeValue(new TextEncoder(), null);

/**
 *
 * A highly approachable solution to sharing memory between multiple threads 💾
 *
 * 💥 **Note:** Does not act exactly the same way as the {@link Map} object!
 */
export class SharedMap<Data extends Record<string, any>> {
    // SharedArrayBuffer containing all keys in bytes
    #keys: Uint8Array;
    // SharedArrayBuffer containing all concatenated values in bytes
    #values: Uint8Array;
    // Instantiate an encoder and decoder once to avoid the
    // need for constantly instantiating them.
    #encoder = new TextEncoder();
    #decoder = new TextDecoder();
    // Unique to each instance
    #key = v4();
    // The identifier for the BroadcastChannel used for coordinating the queue
    #identifier: string;
    #channel: BroadcastChannelEmitter<SharedMapBroadcastChannelEvents>;
    #orchestratorChannel: BroadcastChannelEmitter<SharedMapBroadcastChannelEvents> | null = null;

    /**
     * Each {@link SharedMap} instance has a unique key that can be used
     * to identify it.
     */
    get key() {
        return this.#key;
    }

    /**
     * A single ID assigned to the entire group of SharedMap instances using the
     * allocated memory locations.
     */
    get identifier() {
        return this.#identifier;
    }

    /**
     * An `enum` designed to help you when assigning a fixed byte size
     * for the map's values.
     */
    static readonly option = Bytes;

    get transfer(): SharedMapTransferData<Data> {
        return Object.freeze({
            __keys: this.#keys,
            __values: this.#values,
            __identifier: this.#identifier,
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
            this.#identifier = data.__identifier;
            this.#channel = new BroadcastChannelEmitter(this.#identifier);
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

        // Now we can set up the orchestrator queuing system
        this.#identifier = v4();
        // This is the channel that will be used for communicating with the orchestrator channel.
        this.#channel = new BroadcastChannelEmitter(this.#identifier);

        // The channel which controls the queue. Listens for events and reacts to them accordingly.
        this.#orchestratorChannel = new BroadcastChannelEmitter(this.#identifier);
        const queue: string[] = [];
        this.#orchestratorChannel.on('push_to_queue', (id) => {
            queue.push(id);
            if (queue[0] === id) this.#orchestratorChannel?.send(`ready_${id}`);
        });
        this.#orchestratorChannel.on('shift_from_queue', () => void queue.shift());
        this.#orchestratorChannel.on('get_queue', () => this.#orchestratorChannel!.send('receive_queue', queue));
    }

    #wait(): Promise<string> {
        return new Promise((resolve) => {
            // Generate an ID for the workflow
            const id = v4();

            // // Check the queue by requesting it. If the generated ID is the first one there,
            // // resolve.
            // const receiveQueueHandler = (queue: string[]) => {
            //     if (queue[0] !== id) return;
            //     // If the first item is us then let's resolve
            //     resolve(id);
            //     // And also clean up the listener
            //     this.#channel.off('receive_queue', receiveQueueHandler);
            // };
            // this.#channel.on('receive_queue', receiveQueueHandler);

            // Register the listener before even doing anything else just in case we're
            // notified that it's our turn practically right after we push into the queue.
            this.#channel.on(`ready_${id}`, () => {
                console.log('ok');
                resolve(id);
            });

            // Push the ID into the queue.
            this.#channel.send('push_to_queue', id);

            // // Get the queue, triggering the receiveQueueHandler. Emit this once from this
            // // wait session, but it will be emitted more times by other calls of #wait.
            // this.#channel.send('get_queue');
        });
    }

    async #run<ReturnValue>(workflow: () => ReturnValue): Promise<Awaited<ReturnValue>> {
        // Generate a workflow ID and wait for our turn in the queue.
        await this.#wait();
        // Run the workflow
        const data = await workflow();
        // Once the workflow has finished, emit an event to the orchestrator requesting
        // our item to be popped off the top of the queue. Then if there is another item in
        // the queue, emit the `ready_${nextId}` event to let them know it's their turn.
        this.#channel.send('shift_from_queue');
        this.#channel.once('receive_queue', (queue) => {
            this.#channel.send(`ready_${queue[0]}`);
        });
        this.#channel.send('get_queue');

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
