import { v4 } from 'uuid';
import { isMessengerTransferObject } from './utilities.js';
import { isMainThread } from 'worker_threads';

import { BroadcastChannel } from 'worker_threads';
import type { MessengerTransferData, MessengerMessageBody } from '../types/messenger.js';
import type { Awaitable } from '../types/utilities.js';

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

    constructor(identifier?: string);
    constructor(transferData: MessengerTransferData);
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
     * the two ports originally created when instantiating the first `Messenger`.
     */
    get ID() {
        return this.identifier;
    }

    onMessage<Data extends any = any>(callback: (data: Data) => Awaitable<void>) {
        if (!this.listenerRegistered) this.#registerListener();
        this.listenerCallbacks.push(callback);
    }

    sendMessage<Data extends any>(data: Data) {
        const body: MessengerMessageBody = {
            sender: this.key,
            data,
        };

        this.channel.postMessage(body);
    }

    transfer(): MessengerTransferData {
        return Object.freeze({
            __messengerID: this.identifier,
        });
    }

    close() {
        this.channel.close();
    }
}
