import { MainThreadMessageType, WorkerMessageType } from '../types/messages.js';
import { v4 } from 'uuid';

import type { Worker, TransferListItem } from 'worker_threads';
import type { TaskDefinitions } from '../types/definitions.js';
import type {
    MainThreadCallMessageBody,
    WorkerBaseMessageBody,
    WorkerCallErrorMessageBody,
    WorkerCallReturnMessageBody,
    MainThreadSendMessageBody,
    WorkerSendMessageBody,
    MainThreadMessengerTransferBody,
    WorkerMessengerTransferSuccessBody,
} from '../types/messages.js';
import type { Awaitable, CleanKeyOf, CleanReturnType } from '../types/utilities.js';
import type { ServiceCallOptions } from '../types/workers.js';
import type { Messenger } from '../messenger/messenger.js';

export class Service<Definitions extends TaskDefinitions> {
    #worker: Worker;
    #terminated = false;

    constructor(worker: Worker) {
        this.#worker = worker;
        this.#worker.on('exit', () => (this.#terminated = true));
    }

    get closed() {
        return this.#terminated;
    }

    #assertIsNotTerminated() {
        if (this.#terminated) throw new Error("Attempting to execute operations within a service who's process has exited!");
    }

    async call<Name extends CleanKeyOf<Definitions>>({
        name,
        params,
        transferList,
    }: ServiceCallOptions<Name, Parameters<Definitions[Name]>>) {
        this.#assertIsNotTerminated();

        const key = v4();

        const message: MainThreadCallMessageBody = {
            type: MainThreadMessageType.Call,
            name,
            params: params ?? [],
            key,
        };

        const promise = new Promise((resolve, reject) => {
            const callback = (body: WorkerBaseMessageBody & { key: string }) => {
                // Ignore all messages that aren't one of these two types.
                if (body.type !== WorkerMessageType.CallError && body.type !== WorkerMessageType.CallReturn) return;
                // If the message is for a call with a different key, also ignore the message.
                if (body.key !== key) return;

                if (body.type === WorkerMessageType.CallReturn) {
                    resolve((body as WorkerCallReturnMessageBody).data);
                }

                if (body.type === WorkerMessageType.CallError) {
                    reject((body as WorkerCallErrorMessageBody).data);
                }

                this.#worker.off('message', callback);
            };

            this.#worker.on('message', callback);
        }) as Promise<CleanReturnType<Definitions[Name]>>;

        this.#worker.postMessage(message, transferList);

        return promise;
    }

    async close() {
        this.#terminated = true;
        return void (await this.#worker.terminate());
    }

    sendMessage<Data = any>(data: Data, transferList?: readonly TransferListItem[]) {
        this.#assertIsNotTerminated();

        const body: MainThreadSendMessageBody<Data> = {
            type: MainThreadMessageType.Message,
            data,
        };

        this.#worker!.postMessage(body, transferList);
    }

    onMessage<Data = any>(callback: (body: Data) => Awaitable<any>) {
        this.#assertIsNotTerminated();

        this.#worker.on('message', async (body: WorkerBaseMessageBody) => {
            if (body.type !== WorkerMessageType.Message) return;
            await callback((body as WorkerSendMessageBody<Data>).data);
        });
    }

    offMessage<Data = any>(callback: (body: Data) => Awaitable<any>) {
        this.#assertIsNotTerminated();

        this.#worker.off('message', callback);
    }

    /**
     * Send a `Messenger` object to a service worker. The promise resolves after the worker
     * automatically notifies the main thread that the object was received and processed.
     */
    sendMessenger(messenger: Messenger) {
        this.#assertIsNotTerminated();

        const transferData = messenger.transfer();

        const body: MainThreadMessengerTransferBody = {
            type: MainThreadMessageType.MessengerTransfer,
            data: transferData,
        };

        const promise = new Promise((resolve) => {
            const callback = (body: WorkerBaseMessageBody) => {
                if (body.type !== WorkerMessageType.MessengerTransferSuccess) return;
                if ((body as WorkerMessengerTransferSuccessBody).data !== transferData.__messengerID) return;
                resolve(undefined);

                this.#worker.off('message', callback);
            };

            this.#worker.on('message', callback);
        }) as Promise<void>;

        this.#worker.postMessage(body);

        return promise;
    }
}
