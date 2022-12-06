import { randomUUID as v4 } from 'crypto';
import { isMessengerTransferObject } from './utilities.js';
import { BroadcastChannel } from 'worker_threads';
import { MessengerMessageType } from '../types/messenger.js';
import { listenForStream, prepareWritableToPortStream } from '../streams/index.js';
import { StreamMessageType } from '../types/streams';

import type {
    MessengerTransferData,
    MessengerMessageBody,
    MessengerCloseMessageBody,
    MessengerBaseMessageBody,
    MessengerStreamMessageBody,
} from '../types/messenger.js';
import type { Awaitable } from '../types/utilities.js';
import type { Messagable, StreamBaseMessageBody } from '../types/streams.js';
import type { ReadableFromPort } from '../streams/index.js';

/**
 * Communicate like a boss 🗣️
 *
 * Use {@link Messenger} to send messages between tasks and services (workers), as well
 * as between the main thread and workers. Supported seamlessly by the rest of Nanolith.
 */
export class Messenger {
    #channel: BroadcastChannel;
    #listenerCallbacks: ((data: any) => Awaitable<void>)[] = [];
    #streamEventCallbacks: ((data: any) => void)[] = [];
    /**
     * A value specific to an instance of Messenger. Allows for
     * ignoring messages sent by itself.
     */
    #key = v4();
    /**
     * A value specific to all Messenger instances using the ports
     * in the ports array.
     */
    #identifier: string;
    /**
     * The object implementing the methods on "Messagable" so that the
     * streaming API built for Services and the main thread can also work
     * with the Messenger API.
     */
    #messagableInterop: Messagable = {
        on: (_: 'message', callback: (value: any) => void) => {
            this.#streamEventCallbacks.push(callback);
        },
        off: (_: 'message', callback: (value: any) => void) => {
            const index = this.#streamEventCallbacks.indexOf(callback);
            // If it's -1, the item wasn't found
            if (index <= -1) return;

            this.#streamEventCallbacks.splice(index, 1);
        },
        postMessage: (value: any) => {
            const body: MessengerStreamMessageBody = {
                type: MessengerMessageType.StreamMessage,
                sender: this.#key,
                // Put the StreamMessageBody as the data that will be
                // directly handled by the listeners added by the
                // Nanolith streaming APIs
                data: value,
            };

            this.#channel.postMessage(body);
        },
    };
    #acceptStreams = false;

    /**
     *
     * @param identifier An optional (but recommended) name for the `Messenger` that can be used
     * to reference it later on.
     *
     * @example
     * const messenger = new Messenger();
     * const messenger2 = new Messenger('my-messenger');
     */
    constructor(identifier?: string);
    /**
     *
     * @param transferData A {@link MessageTransferData} object containing an identifier reference to
     * another messenger.
     *
     * @example
     * const messenger = new Messenger('my-messenger');
     * const messenger2 = new Messenger(messenger.transfer());
     *
     */
    constructor(transferData: MessengerTransferData);
    /**
     *
     * @param data An `identifier` (string) or a {@link MessageTransferData} object.
     */
    constructor(data?: MessengerTransferData | string) {
        // Only allow either nothing, strings, or MessengerTransferObjects to pass through
        if (data && typeof data !== 'string' && !isMessengerTransferObject(data as Exclude<typeof data, string>)) {
            throw new Error('Must either provide a string to create a new Messenger, or a MessengerTransferData object.');
        }

        // When provided a MessengerTransferObject
        if (data && typeof data !== 'string') {
            this.#identifier = data.__messengerID;

            this.#channel = new BroadcastChannel(data.__messengerID);
        } else {
            // When provided nothing or a string
            // Assign each set of messengers an identifier. This
            // identifier is used to "transfer" the messenger around.
            this.#identifier = typeof data === 'string' ? data : v4();
            this.#channel = new BroadcastChannel(this.#identifier);
        }

        this.#channel.unref();

        this.#registerMainListener();
    }

    /**
     * A function that will not be run until `onMessage` is called for the first time.
     */
    #registerMainListener() {
        this.#channel.onmessage = async (event) => {
            const { data: body } = event as { data: MessengerBaseMessageBody };

            switch (body?.type) {
                // Handle "closeAll" calls
                case MessengerMessageType.Close: {
                    return this.#channel.close();
                }
                case MessengerMessageType.StreamMessage: {
                    if (body.sender === this.#key) return;
                    // If we haven't registered a .onStream listener, that means we don't want to
                    // accept streams on this Messenger instance on the channel, and we should only
                    // accept the "Ready" message type in cases where we are sending a stream.
                    if (
                        [StreamMessageType.Start, StreamMessageType.Chunk, StreamMessageType.End].includes(
                            ((body as MessengerStreamMessageBody)?.data as StreamBaseMessageBody)?.type
                        ) &&
                        !this.#acceptStreams
                    ) {
                        return;
                    }

                    this.#streamEventCallbacks.map((callback) => callback((body as MessengerMessageBody).data));
                    break;
                }
                case MessengerMessageType.Message: {
                    // If the message was sent by this Messenger, just ignore it. We don't want to
                    // run our listener callbacks for messages we sent.
                    if (body.sender === this.#key) return;
                    await Promise.all(this.#listenerCallbacks.map((callback) => callback((body as MessengerMessageBody).data)));
                    break;
                }
                default:
                    break;
            }
        };
    }

    /**
     * The unique identifier that is shared across all messenger instances using
     * the two ports originally created when instantiating the first {@link Messenger}.
     *
     * @example
     * const messenger = new Messenger('my-messenger');
     * console.log(messenger.ID); // -> 'my-messenger'
     *
     * const messenger2 = new Messenger(messenger.transfer());
     * console.log(messenger.ID === messenger2.ID) // -> true
     */
    get ID() {
        return this.#identifier;
    }

    /**
     * Each `Messenger` instance is assigned a unique key that allows it to internally ignore
     * messages on the {@link BroadcastChannel} which were sent by itself.
     *
     * @example
     * const messenger = new Messenger('my-messenger');
     * const messenger2 = new Messenger(messenger.transfer());
     *
     * console.log(messenger.ID === messenger2.ID) // -> true
     * console.log(messenger.uniqueKey === messenger2.uniqueKey) // -> false
     */
    get uniqueKey() {
        return this.#key;
    }

    /**
     * Create a {@link Writable} instance that can be piped into in order to stream data to
     * other `Messenger`s on the channel. The messengers can listen for incoming streams with the
     * `messenger.onStream()` listener.
     *
     * @param metaData Any specific data about the stream that should be accessible when
     * using it.
     */
    createStream(metaData?: Record<any, any>) {
        return prepareWritableToPortStream(this.#messagableInterop, metaData ?? {});
    }

    /**
     * Receive data streams on the `Messenger`.
     *
     * @param callback The callback to run once the stream has been initialized and is ready to consume.
     */
    onStream(callback: (stream: ReadableFromPort<Messagable>) => Awaitable<void>) {
        this.#acceptStreams = true;
        listenForStream(this.#messagableInterop, callback);
    }

    /**
     * Listen for messages coming to the `Messenger`.
     *
     * @param callback A function to run each time a message is received.
     *
     * @example
     * messenger.onMessage<string>((data) => console.log(data, 'received!'));
     */
    onMessage<Data = any>(callback: (data: Data) => Awaitable<void>) {
        this.#listenerCallbacks.push(callback);
    }

    /**
     * Wait for specific messages on the `Messenger`.
     *
     * @param callback A function returning a boolean that will be run each time a message is received from another `Messenger`
     * Once the condition is met and the function returns `true`, the promise will resolve with the data received.
     *
     * @returns A promise of the received data.
     *
     * @example
     * const data = await messenger.waitForMessage<{ foo: string }>(({ foo }) => foo === 'bar');
     *
     * console.log(data);
     */
    async waitForMessage<Data = any>(callback: (data: Data) => Awaitable<boolean>) {
        return new Promise((resolve) => {
            const handler = async (data: Data) => {
                if (await callback(data)) {
                    resolve(data);

                    this.offMessage(handler);
                }
            };

            this.onMessage<Data>(handler);
        }) as Promise<Data>;
    }

    /**
     * Remove a function from the list of callbacks to be run when a message is received on the `Messenger`.
     *
     * @param callback The function to remove.
     *
     * @example
     * const callback = (data: string) => console.log(data, 'received!');
     *
     * messenger.onMessage(callback);
     *
     * // ...later...
     * messenger.offMessage(callback);
     */
    offMessage<Data = any>(callback: (body: Data) => Awaitable<void>) {
        const index = this.#listenerCallbacks.indexOf(callback);
        // If it's -1, the item wasn't found
        if (index <= -1) return;

        this.#listenerCallbacks.splice(index, 1);
    }

    /**
     * Send a messenger to be received by any other `Messenger` instances with the same identifier.
     *
     * @param data The data to send to the other `Messenger`s.
     *
     * @example
     * messenger.sendMessage('foo');
     * messenger.sendMessage({ hello: 'world' });
     */
    sendMessage<Data = any>(data: Data) {
        const body: MessengerMessageBody = {
            type: MessengerMessageType.Message,
            sender: this.#key,
            data,
        };

        this.#channel.postMessage(body);
    }

    /**
     * Turns the {@link Messenger} instance into an object that can be sent to and from workers.
     *
     * @returns A {@link MessageTransferData} object
     */
    transfer(): MessengerTransferData {
        return Object.freeze({
            __messengerID: this.#identifier,
        });
    }

    /**
     * By default, the {@link BroadcastChannel} is unreffed. Call this function to change that.
     * When `true`, [`ref()`](https://nodejs.org/api/worker_threads.html#broadcastchannelref) will be called.
     * When `false`, [`unref()`](https://nodejs.org/api/worker_threads.html#broadcastchannelunref) will be called.
     */
    setRef(option: boolean) {
        if (option) return this.#channel.ref();
        this.#channel.unref();
    }

    /**
     * Closes the underlying {@link BroadcastChannel} connection that is being used.
     * Does not close all Messenger objects. Use `messenger.closeAll()` instead for that.
     */
    close() {
        this.#channel.close();
        // Early cleanup
        this.#listenerCallbacks = [];
    }

    /**
     * Closes all underlying {@link BroadcastChannel} connections on all {@link Messenger}
     * objects that are currently active for the corresponding identifier.
     */
    closeAll() {
        // Send a message to all instances listening on the BroadcastChannel
        // telling them to close.
        const body: MessengerCloseMessageBody = {
            sender: this.#key,
            type: MessengerMessageType.Close,
        };

        this.#channel.postMessage(body);
    }
}
