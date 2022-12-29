import { randomUUID as v4 } from 'crypto';
import { createSharedArrayBuffer, encodeValue, isSharedMapTransferData } from './utilities.js';
import * as Keys from './keys.js';
import { Bytes, NULL_ENCODED, ENCODER, DECODER } from '@constants/shared_map.js';
import { BroadcastChannelEmitter } from './broadcast_channel_emitter.js';

import type {
    Key,
    SharedMapTransferData,
    SharedMapOptions,
    SharedMapBroadcastChannelEvents,
    SetWithPreviousHandler,
} from '@typing/shared_map.js';
import type { CleanKeyOf } from '@typing/utilities.js';
import type { SharedMapTransfer } from '@nanolith';

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
    #key = v4();
    // The identifier for the BroadcastChannel used for coordinating the queue
    #identifier: string;
    // Orchestrates the queue.
    #orchestratorChannel: BroadcastChannelEmitter<SharedMapBroadcastChannelEvents> | null = null;
    #closed = false;

    /**
     * Each {@link SharedMap} instance has a unique key that can be used
     * to identify it.
     */
    get uniqueKey() {
        return this.#key;
    }

    /**
     * A single ID assigned to the entire group of SharedMap instances using the
     * allocated memory locations.
     */
    get ID() {
        return this.#identifier;
    }

    /**
     * An `enum` designed to help you when assigning a fixed byte size
     * for the map's values.
     */
    static readonly option = Bytes;

    get transfer(): SharedMapTransferData<Data> {
        this.#assertNotClosed();

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

        // The channel which controls the queue. Listens for events and reacts to them accordingly.
        this.#orchestratorChannel = new BroadcastChannelEmitter(this.#identifier);
        const queue: string[] = [];

        this.#orchestratorChannel.on('push_to_queue', (id) => {
            queue.push(id);
            // If we push to the back of the queue but are first in line, we are ready to go.
            if (queue[0] === id) this.#orchestratorChannel?.send(`ready_${id}`);
        });

        this.#orchestratorChannel.on('remove_from_queue', (id) => {
            // Find the index of the ID in the queue
            const index = queue.indexOf(id);
            // Remove the ID from the queue
            if (index !== -1) queue.splice(index, 1);

            // If there is a first item in the queue, notify them that
            if (queue[0]) this.#orchestratorChannel!.send(`ready_${queue[0]}`);
        });
    }

    /**
     * Disable the instance from doing any more operations. If this {@link SharedMap} instance is the
     * orchestrator, it will close the orchestration channel and no other instances will continue to work.
     */
    close() {
        // If this SharedMap is the orchestrator, close the orchestrator channel as well
        if (this.#orchestratorChannel) this.#orchestratorChannel.close();
        this.#closed = true;
    }

    #assertNotClosed() {
        if (!this.#closed) return;
        throw new Error('Cannot perform actions on a closed SharedMap instance!');
    }

    #wait(): Promise<[string, BroadcastChannelEmitter<SharedMapBroadcastChannelEvents>]> {
        return new Promise((resolve) => {
            const channel = new BroadcastChannelEmitter(this.#identifier);
            // Generate an ID for the workflow
            const id = v4();

            // Wait for a notification that we are ready to run the task
            channel.once(`ready_${id}`, () => {
                resolve([id, channel]);
            });

            // Push the ID into the queue. Let the queue handle the rest.
            channel.send('push_to_queue', id);
        });
    }

    async #run<ReturnValue>(workflow: () => ReturnValue): Promise<Awaited<ReturnValue>> {
        // Generate a workflow ID and wait for our turn in the queue.
        const [id, channel] = await this.#wait();
        // Run the workflow
        const data = await workflow();
        // Once the workflow has finished, emit an event to the orchestrator requesting
        // our item to be popped off the top of the queue. Then if there is another item in
        // the queue, emit the `ready_${nextId}` event to let them know it's their turn.
        channel.send('remove_from_queue', id);

        channel.close();

        // Return out the return value, if any
        return data;
    }

    #get<KeyName extends CleanKeyOf<Data extends SharedMapTransferData<infer Type> ? Type : Data>>(name: KeyName) {
        const decodedKeys = DECODER.decode(this.#keys);
        const match = Keys.matchKey(decodedKeys, name);
        if (!match) return null;

        const { start, end } = Keys.parseKey(match as Key);
        if (start === undefined || end === undefined) throw new Error('Failed to parse key');

        return DECODER.decode(this.#values.subarray(start, end + 1));
    }

    /**
     * Retrieve items on the {@link SharedMap}.
     *
     * @param name The name of the key to retrieve the corresponding value of
     * @returns A string that can be converted back into the original data type
     */
    get<KeyName extends CleanKeyOf<Data extends SharedMapTransferData<infer Type> ? Type : Data>>(name: KeyName) {
        this.#assertNotClosed();

        return this.#run(() => {
            return this.#get(name);
        });
    }

    #set<KeyName extends CleanKeyOf<Data extends SharedMapTransferData<infer Type> ? Type : Data>>(name: KeyName, value: Data[KeyName]) {
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
            return;
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
            return;
        }

        const valueEnd = valueStart + encodedValue.byteLength;

        // If we aren't modifying the final value, rewrite the old data to the new offset so
        // it's not nastily overwritten
        if (previousValueEnd !== +finalPosition) {
            // ? Potentially use .subarray here instead?
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

        this.#keys.set(ENCODER.encode(updatedKeys));
    }

    /**
     * Set new values for existing items on the {@link SharedMap}.
     *
     * @param name The name of the key to set. The key **must** already exist on the map.
     * @param value The new value for the key.
     */
    set<KeyName extends CleanKeyOf<Data extends SharedMapTransferData<infer Type> ? Type : Data>>(
        name: KeyName,
        handler: SetWithPreviousHandler<
            Data extends SharedMapTransfer<infer Type> ? (KeyName extends keyof Type ? Type[KeyName] : Data[KeyName]) : Data[KeyName]
        >
    ): Promise<void>;
    set<KeyName extends CleanKeyOf<Data extends SharedMapTransferData<infer Type> ? Type : Data>>(
        name: KeyName,
        value: Data extends SharedMapTransfer<infer Type>
            ? KeyName extends keyof Type
                ? Type[KeyName]
                : Data[KeyName]
            :
                  | Data[KeyName]
                  | SetWithPreviousHandler<
                        Data extends SharedMapTransfer<infer Type>
                            ? KeyName extends keyof Type
                                ? Type[KeyName]
                                : Data[KeyName]
                            : Data[KeyName]
                    >
    ): Promise<void>;
    set<KeyName extends CleanKeyOf<Data extends SharedMapTransferData<infer Type> ? Type : Data>>(
        name: KeyName,
        value: Data extends SharedMapTransfer<infer Type> ? (KeyName extends keyof Type ? Type[KeyName] : Data[KeyName]) : Data[KeyName]
    ) {
        this.#assertNotClosed();

        return this.#run(async () => {
            // If the value isn't a function, set the value straight.
            if (typeof value !== 'function') return this.#set(name, value);

            // Otherwise, feed the previous value into the handler to generate a new
            // value, then set that as the new value.
            const newValue = await value(this.#get(name));
            return this.#set(name, newValue);
        });
    }
}
