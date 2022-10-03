import { v4 } from 'uuid';
import { MessageChannel } from 'worker_threads';
import { isMessengerTransferObject } from './utilities.js';

import type { MessagePort, TransferListItem } from 'worker_threads';
import type { MessengerTransferData, MessengerMessageBody } from '../types/messenger.js';
import type { Awaitable } from '../types/utilities.js';

export class Messenger {
    private ports: MessagePort[] = [];
    /**
     * A value specific to an instance of Messenger. Allows for
     * ignoring messages sent by itself.
     */
    private key: string;
    /**
     * A value specific to all Messenger instances using the ports
     * in the
     */
    private identifier: string;

    constructor(identifier?: string);
    constructor(transferData: MessengerTransferData);
    constructor(data?: MessengerTransferData | string) {
        if (data && typeof data !== 'string' && isMessengerTransferObject(data as Exclude<typeof data, string>)) {
            this.ports = data.__ports;
            this.key = v4();
            this.identifier = data.__messengerID;
            return;
        }

        const { port1, port2 } = new MessageChannel();
        // The first port will always be used for listening, while the second will
        // always be used for sending.
        this.ports = [port1, port2];
        this.ports.forEach((port) => port.unref());
        this.key = v4();
        this.identifier = typeof data === 'string' ? data : v4();
    }

    /**
     * The unique identifier that is shared across all messenger instances using
     * the two ports originally created when instantiating the first `Messenger`.
     */
    get ID() {
        return this.identifier;
    }

    onMessage<Data extends any = any>(callback: (data: Data) => Awaitable<void>) {
        // Listen on the first port for any messages.
        this.ports[0].on('message', async (body: MessengerMessageBody) => {
            // If the message was send by this Messenger, just ignore it.
            if (body.sender === this.key) return;
            await callback(body.data);
        });
    }

    sendMessage<Data extends any>(data: Data, transferList?: readonly TransferListItem[]) {
        const body: MessengerMessageBody = {
            sender: this.key,
            data,
        };

        // Send a message on the second port, which will be received on the first port.
        this.ports[1].postMessage(body, transferList);
    }

    transfer(): MessengerTransferData {
        return Object.freeze({
            __ports: this.ports,
            __messengerID: this.identifier,
        });
    }

    close() {
        this.ports.forEach((port) => port.close());
    }
}
