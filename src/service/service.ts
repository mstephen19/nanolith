import { MainThreadMessageType, WorkerMessageType } from '../types/messages.js';
import v4 from 'lite-uuid-v4';

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
import { TypedEmitter } from 'tiny-typed-emitter';

type ServiceEvents = {
    /**
     * An event that is emitted when the service worker has exited its process.
     */
    terminated: () => void;
    /**
     * An event that is emitted when the service worker makes a call.
     */
    calling: (key: string) => void;
    /**
     * An event that is emitted when the service worker finishes making a call and
     * has waited for the return value of the task.
     */
    called: (key: string) => void;
};

/**
 * Allows for the interaction between the main thread and long-running service workers 🏃
 */
export class Service<Definitions extends TaskDefinitions> extends TypedEmitter<ServiceEvents> {
    #worker: Worker;
    #terminated = false;

    constructor(worker: Worker) {
        super();

        this.#worker = worker;
        this.#worker.on('exit', () => {
            this.#terminated = true;
            // Emit an event notifying that the service has been terminated.
            this.emit('terminated');
        });
    }

    /**
     * Whether or not the underlying {@link Worker} has exited its process.
     * This will be `true` after calling `await service.close()`
     */
    get closed() {
        return this.#terminated;
    }

    /**
     * The thread ID of the underlying worker for the `Service` instance.
     */
    get threadID() {
        return this.#worker.threadId;
    }

    /**
     * Returns the raw underlying {@link Worker} instance being used by the service.
     */
    get worker() {
        return this.#worker;
    }

    #assertIsNotTerminated() {
        if (this.#terminated) throw new Error("Attempting to execute operations within a service who's process has exited!");
    }

    /**
     * Call a task to be run within the service worker
     *
     * @param options A {@link ServiceCallOptions} object
     * @returns A promise of the task function's return value
     *
     * @example
     * const service = await api.launchService({
     *     exceptionHandler: ({ error }) => {
     *         console.log(error.message);
     *     },
     * });
     *
     * const data = await service.call({
     *     name: 'myTaskFunction',
     *     params: ['foo', 'bar', 123],
     * });
     *
     * console.log(data);
     */
    async call<Name extends CleanKeyOf<Definitions>>({
        name,
        params,
        transferList,
    }: ServiceCallOptions<Name, Parameters<Definitions[Name]>>) {
        this.#assertIsNotTerminated();

        const key = v4();

        // Emit an event notifying that the service is making a call
        this.emit('calling', key);

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

                // Resolve with the function's return value.
                if (body.type === WorkerMessageType.CallReturn) {
                    resolve((body as WorkerCallReturnMessageBody).data);
                }

                // Or, if the call failed, reject with the caught error.
                if (body.type === WorkerMessageType.CallError) {
                    reject((body as WorkerCallErrorMessageBody).data);
                }

                // Clean up listener
                this.#worker.off('message', callback);
                // Emit an event notifying that the service has completed making
                // a call
                this.emit('called', key);
            };

            this.#worker.on('message', callback);
        }) as Promise<CleanReturnType<Definitions[Name]>>;

        this.#worker.postMessage(message, transferList);

        return promise;
    }

    /**
     * Terminates the worker, ending its process and marking the {@link Service} instance as `closed`.
     */
    async close() {
        this.#terminated = true;
        return void (await this.#worker.terminate());
    }

    /**
     *
     * @param data The data to send to the service.
     * @param transferList An optional array of {@link TransferListItem}s. See the
     * [Node.js documentation](https://nodejs.org/api/worker_threads.html#workerpostmessagevalue-transferlist) for more information.
     *
     * @example
     * service.sendMessage('foo');
     * service.sendMessage({ hello: 'world' });
     */
    sendMessage<Data = any>(data: Data, transferList?: readonly TransferListItem[]) {
        this.#assertIsNotTerminated();

        const body: MainThreadSendMessageBody<Data> = {
            type: MainThreadMessageType.Message,
            data,
        };

        this.#worker!.postMessage(body, transferList);
    }

    /**
     * Listen for messages coming from the service.
     *
     * @param callback A function to run each time a message is received from the service.
     *
     * @example
     * service.onMessage<string>((data) => console.log(data, 'received!'));
     */
    onMessage<Data = any>(callback: (body: Data) => Awaitable<any>) {
        this.#assertIsNotTerminated();

        this.#worker.on('message', async (body: WorkerBaseMessageBody) => {
            if (body.type !== WorkerMessageType.Message) return;
            await callback((body as WorkerSendMessageBody<Data>).data);
        });
    }

    /**
     * Remove a function from the list of callbacks to be run when a message is received from the service.
     *
     * @param callback The function to remove.
     *
     * @example
     * const callback = (data: string) => console.log(data, 'received!');
     *
     * service.onMessage(callback);
     *
     * // ...later...
     * service.offMessage(callback);
     */
    offMessage<Data = any>(callback: (body: Data) => Awaitable<any>) {
        this.#assertIsNotTerminated();

        this.#worker.off('message', callback);
    }

    /**
     * Dynamically sends a {@link Messenger} object to a service worker.
     * Allows for the usage of `Messenger`s created after a service is launched.
     *
     * @param messenger A {@link Messenger} object
     * @returns A promise which resolves after the worker automatically notifies
     * the main thread that the object was received and processed.
     *
     * @example
     * const messenger = new Messenger('my-messenger');
     *
     * await service.sendMessenger(messenger);
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
