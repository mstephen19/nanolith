import { randomUUID as v4 } from 'crypto';
import { TypedEmitter } from 'tiny-typed-emitter';
import { listenForStream, prepareWritableToPortStream } from '@streams';
import { MainThreadMessageType, WorkerMessageType } from '@constants/messages.js';

import type { Worker, TransferListItem } from 'worker_threads';
import type { TaskDefinitions, Tasks } from '@typing/definitions.js';
import type {
    MainThreadCallMessageBody,
    WorkerBaseMessageBody,
    WorkerCallErrorMessageBody,
    WorkerCallReturnMessageBody,
    MainThreadSendMessageBody,
    WorkerSendMessageBody,
    MainThreadMessengerTransferBody,
    WorkerMessengerTransferSuccessBody,
    RemoveListenerFunction,
} from '@typing/messages.js';
import type { Awaitable, CleanKeyOf, CleanReturnType } from '@typing/utilities.js';
import type { ServiceCallOptions } from '@typing/workers.js';
import type { Messenger } from '@messenger';
import type { OnStreamCallback } from '@typing/streams.js';

type ServiceEvents = {
    /**
     * An event that is emitted when the service has exited its process.
     */
    terminated: () => void;
};

/**
 * Allows for the interaction between the main thread and long-running services 🏃
 */
export class Service<Definitions extends TaskDefinitions> extends TypedEmitter<ServiceEvents> {
    #worker: Worker;
    #terminated = false;
    #active = 0;
    #callbacks: Map<string, { resolve: (value: any) => void; reject: (value: any) => void }> = new Map();

    constructor(worker: Worker) {
        super();

        this.#worker = worker;

        // Only attach one listener onto the worker instead of attaching a listener for each task called.
        const taskHandler = (body: WorkerBaseMessageBody & { key: string }) => {
            this.#callbacks.forEach(({ resolve, reject }, key) => {
                // If the message is for a call with a different key, also ignore the message.
                if (body.key !== key) return;

                switch (body.type) {
                    case WorkerMessageType.CallReturn: {
                        resolve((body as WorkerCallReturnMessageBody).data);
                        break;
                    }
                    case WorkerMessageType.CallError: {
                        reject((body as WorkerCallErrorMessageBody).data);
                        break;
                    }
                    default:
                        return;
                }
            });
        };

        this.#worker.on('message', taskHandler);

        // Exit handler
        this.#worker.once('exit', () => {
            this.#terminated = true;
            // Early cleanup of the callbacks map
            this.#callbacks.clear();
            // Emit an event notifying that the service has been terminated.
            this.emit('terminated');
            // Clean up task handler listener
            worker.off('message', taskHandler);
        });
    }

    /**
     * Get the current number of active calls running on the `Service` instance.
     */
    get activeCalls() {
        return this.#active;
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
        if (this.#terminated) throw new Error('Attempting to execute operations on a service with an exited process!');
    }

    /**
     * Call a task to be run within the service.
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
    async call<Name extends CleanKeyOf<Tasks<Definitions>>>({
        name,
        params,
        transferList,
    }: ServiceCallOptions<Name, Parameters<Definitions[Name]>>) {
        this.#assertIsNotTerminated();

        const key = v4();

        // Increase the current number of active calls
        this.#active++;

        const message: MainThreadCallMessageBody = {
            type: MainThreadMessageType.Call,
            name,
            params: params ?? [],
            key,
        };

        const promise = new Promise((resolve, reject) => {
            // Add the data to the callbacks map. The promise
            // will be resolved when the corresponding message
            // is received.
            this.#addCallbacks({ key, resolve, reject });
        }) as Promise<CleanReturnType<Definitions[Name]>>;

        this.#worker.postMessage(message, transferList);

        const data = await promise;
        this.#active--;
        return data;
    }

    #addCallbacks({ key, ...rest }: { key: string; resolve: (value: any) => void; reject: (value: any) => void }) {
        this.#callbacks.set(key, rest);

        return () => {
            this.#callbacks.delete(key);
        };
    }

    /**
     * Terminates the worker, ending its process and marking the {@link Service} instance as `closed`.
     */
    async close() {
        this.#terminated = true;
        return void (await this.#worker.terminate());
    }

    /**
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
     * Create a {@link Writable} instance that can be piped into in order to stream data to
     * the service. The service can listen for incoming streams with the
     * `parent.onStream()` listener.
     *
     * @param metaData Any specific data about the stream that should be accessible when
     * using it.
     */
    createStream(metaData?: Record<any, any>) {
        return prepareWritableToPortStream(this.#worker, metaData ?? {});
    }

    /**
     * Receive data streams from the service.
     *
     * @param callback The callback to run once the stream has been initialized and is ready to consume.
     */
    onStream(callback: OnStreamCallback<typeof this['worker']>) {
        return listenForStream(this.#worker, callback);
    }

    /**
     * Listen for messages coming from the service.
     *
     * @param callback A function to run each time a message is received from the service.
     *
     * @returns A function that will remove the listener when called.
     *
     * @example
     * service.onMessage<string>((data) => console.log(data, 'received!'));
     */
    onMessage<Data = any>(callback: (body: Data) => Awaitable<any>): RemoveListenerFunction {
        this.#assertIsNotTerminated();

        const handler = async (body: WorkerBaseMessageBody) => {
            if (body.type !== WorkerMessageType.Message) return;
            await callback((body as WorkerSendMessageBody<Data>).data);
        };

        this.#worker.on('message', handler);

        return () => this.#worker.off('message', handler);
    }

    /**
     * Wait for a specific message coming from the service.
     *
     * @param callback A function returning a boolean that will be run each time a message is received from the service.
     * Once the condition is met and the function returns `true`, the promise will resolve with the data received.
     *
     * @returns A promise of the received data.
     *
     * @example
     * const data = await service.waitForMessage<{ foo: string }>(({ foo }) => foo === 'bar');
     *
     * console.log(data);
     */
    async waitForMessage<Data = any>(callback: (body: Data) => Awaitable<boolean>) {
        this.#assertIsNotTerminated();

        return new Promise((resolve) => {
            const handler = async (body: WorkerBaseMessageBody) => {
                if (body.type !== WorkerMessageType.Message) return;
                const { data } = body as WorkerSendMessageBody<Data>;

                if (callback(data)) {
                    resolve(data);

                    // Clean up the listener
                    this.#worker.off('message', handler);
                }
            };

            this.#worker.on('message', handler);
        }) as Promise<Data>;
    }

    /**
     * Dynamically send a {@link Messenger} to a service.
     * Allows for the usage of `Messenger`s created after a service is launched.
     *
     * @param messenger A {@link Messenger} objectd
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

        const transferData = messenger.raw;

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
