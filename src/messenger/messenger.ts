import { v4 } from 'uuid';
import { isMessengerTransferObject } from './utilities.js';
import { BroadcastChannel } from 'worker_threads';

import type { MessengerTransferData, MessengerMessageBody } from '../types/messenger.js';
import type { Awaitable } from '../types/utilities.js';

/**
 * Communicate like a boss 🗣️
 *
 * Use {@link Messenger} to send messages between tasks and services (workers), as well
 * as between the main thread and workers. Supported seamlessly by the rest of Nanolith.
 */
export class Messenger {
    private channel: BroadcastChannel;
    private listenerCallbacks: ((data: any) => Awaitable<void>)[] = [];
    private listenerRegistered = false;
    /**
     * A value specific to an instance of Messenger. Allows for
     * ignoring messages sent by itself.
     */
    private key: string;
    /**
     * A value specific to all Messenger instances using the ports
     * in the ports array.
     */
    private identifier: string;

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
        if (data && typeof data !== 'string' && !isMessengerTransferObject(data as Exclude<typeof data, string>)) {
            throw new Error('Must either provide a string to create a new Messenger, or a MessengerTransferData object.');
        }

        if (data && typeof data !== 'string') {
            this.channel = new BroadcastChannel(data.__messengerID);
            this.channel.unref();
            this.key = v4();
            this.identifier = data.__messengerID;
            return;
        }
        // The first port will always be used for listening, while the second will
        // always be used for sending.
        this.key = v4();
        this.identifier = typeof data === 'string' ? data : v4();
        this.channel = new BroadcastChannel(this.identifier);
        this.channel.unref();
    }

    #registerListener() {
        this.channel.onmessage = async (event) => {
            const { data: body } = event as { data: MessengerMessageBody };
            // If the message was send by this Messenger, just ignore it.
            if (body.sender === this.key) return;
            this.listenerCallbacks.forEach((callback) => callback(body.data));
        };

        this.listenerRegistered = true;
    }

    /**
     * The unique identifier that is shared across all messenger instances using
     * the two ports originally created when instantiating the first {@link Messenger}.
     *
     * @example
     * const messenger = new Messenger('my-messenger');
     *
     * console.log(messenger.ID); // -> 'my-messenger'
     */
    get ID() {
        return this.identifier;
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
        if (!this.listenerRegistered) this.#registerListener();
        this.listenerCallbacks.push(callback);
    }

    /**
     *
     * @param data The data to send to the other `Messenger`s.
     *
     * @example
     * messenger.sendMessage('foo');
     * messenger.sendMessage({ hello: 'world' });
     */
    sendMessage<Data = any>(data: Data) {
        const body: MessengerMessageBody = {
            sender: this.key,
            data,
        };

        this.channel.postMessage(body);
    }

    /**
     * Turns the {@link Messenger} instance into an object that can be send to and from workers.
     *
     * @returns A {@link MessageTransferData} object
     */
    transfer(): MessengerTransferData {
        return Object.freeze({
            __messengerID: this.identifier,
        });
    }

    /**
     * Closes the underlying {@link BroadcastChannel} that is being used.
     */
    close() {
        this.channel.close();
    }
}
