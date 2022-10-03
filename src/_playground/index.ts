import { api } from './worker.js';
import { MessageChannel, MessagePort, TransferListItem } from 'worker_threads';
import { v4 } from 'uuid';
import { Awaitable } from '../types/utilities.js';

type MessengerMessageBody = {
    sender: string;
    data: any;
};

type MessengerTransferData = Readonly<{
    __ports: MessagePort[];
    __transferID: string;
}>;

type IsMessengerTransferObject = (data: MessengerTransferData) => asserts data is MessengerTransferData;

export const assertIsMessengerTransferObject: IsMessengerTransferObject = (
    data: MessengerTransferData
): asserts data is MessengerTransferData => {
    const hasValidTransferID = !!data?.__transferID && typeof data.__transferID === 'string';
    const hasValidPorts = !!data?.__ports && Array.isArray(data?.__ports) && data?.__ports.every((item) => item instanceof MessagePort);

    if (!hasValidTransferID || !hasValidPorts) {
        throw new Error('Provided object is not a valid MessageTransferData object!');
    }
};

class Messenger {
    private ports: MessagePort[] = [];
    private key: string;

    constructor();
    constructor(transferData: MessengerTransferData);
    constructor(transferData?: MessengerTransferData) {
        if (transferData) {
            assertIsMessengerTransferObject(transferData);
            this.ports = transferData.__ports;
            this.key = v4();
            return;
        }

        const { port1, port2 } = new MessageChannel();
        // The first port will always be used for listening, while the second will
        // always be used for sending.
        this.ports = [port1, port2];
        this.key = v4();
    }

    get ID() {
        return this.key;
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
            __transferID: this.key,
        });
    }
}

const messenger = new Messenger();
const messenger2 = new Messenger(messenger.transfer());

messenger2.onMessage<string>((data) => {
    console.log(data);
});

messenger.onMessage<string>((data) => {
    console.log(data);
});

messenger.sendMessage('hey from first port');
messenger2.sendMessage('hey from second port');
