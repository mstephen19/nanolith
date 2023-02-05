import { parentPort, workerData } from 'worker_threads';
import { MainThreadMessageType, WorkerMessageType } from '@constants/messages.js';
import { assertIsNotMainThread } from '@utilities';
import { listenForStream, prepareWritableToPortStream } from '@streams';

import type { TransferListItem } from 'worker_threads';
import type { Awaitable } from '@typing/utilities.js';
import type {
    WorkerSendMessageBody,
    MainThreadBaseMessageBody,
    MainThreadSendMessageBody,
    MainThreadMessengerTransferBody,
} from '@typing/messages.js';
import type { Messenger } from '../messenger/index.js';
import type { BaseWorkerData } from '@typing/worker_data.js';
import type { RemoveListenerFunction } from '@typing/messages.js';
import type { OnStreamCallback } from '@typing/streams.js';

/**
 *
 * @param data The data to send to the main thread.
 * @param transferList An optional array of {@link TransferListItem}s. See the
 * [Node.js documentation](https://nodejs.org/api/worker_threads.html#workerpostmessagevalue-transferlist) for more information.
 *
 * @example
 * ParentThread.sendMessage('foo');
 * ParentThread.sendMessage({ hello: 'world' });
 */
function sendMessage<Data = any>(data: Data, transferList?: readonly TransferListItem[]) {
    assertIsNotMainThread('ParentThread.sendMessage');

    const body: WorkerSendMessageBody<Data> = {
        type: WorkerMessageType.Message,
        data,
    };

    parentPort!.postMessage(body, transferList);
}

/**
 * Wait for specific messages coming from the main thread.
 *
 * @param callback A function returning a boolean that will be run each time a message is received the main thread.
 * Once the condition is met and the function returns `true`, the promise will resolve with the data received.
 *
 * @returns A promise of the received data.
 *
 * @example
 * const data = await ParentThread.waitForMessage<{ foo: string }>(({ foo }) => foo === 'bar');
 *
 * console.log(data);
 */
async function waitForMessage<Data = any>(callback: (body: Data) => Awaitable<boolean>) {
    assertIsNotMainThread('ParentThread.waitForMessage');

    return new Promise((resolve) => {
        const handler = async (body: MainThreadBaseMessageBody) => {
            if (body.type !== MainThreadMessageType.Message) return;
            const { data } = body as MainThreadSendMessageBody<Data>;

            if (await callback(data)) {
                resolve(data);

                // Clean up listener
                parentPort!.off('message', handler);
            }
        };

        parentPort!.on('message', handler);
    }) as Promise<Data>;
}

/**
 * Listen for messages coming from the main thread.
 *
 * @param callback A function to run each time a message is received from the main thread.
 *
 * @returns A function that will remove the listener when called.
 *
 * @example
 * ParentThread.onMessage<string>((data) => console.log(data, 'received!'));
 */
function onMessage<Data = any>(callback: (body: Data) => Awaitable<void>): RemoveListenerFunction {
    assertIsNotMainThread('ParentThread.onMessage');

    const handler = async (body: MainThreadBaseMessageBody) => {
        if (body.type !== MainThreadMessageType.Message) return;
        await callback((body as MainThreadSendMessageBody<Data>).data);
    };

    parentPort!.on('message', handler);

    return () => parentPort!.off('message', handler);
}

/**
 * Listen for {@link Messenger}s being sent to the worker from the main thread.
 *
 * @param callback A function to run each time a `Messenger` is received from the main thread.
 *
 * @returns A function that will remove the listener when called.
 *
 * @example
 * ParentThread.onMessengerReceived((messenger) => console.log(messenger.ID));
 */
function onMessengerReceived(callback: (messenger: Messenger) => Awaitable<any>) {
    assertIsNotMainThread('ParentThread.onMessengerReceived');

    const { messengers } = workerData as BaseWorkerData;

    const handler = async (body: MainThreadBaseMessageBody) => {
        if (body.type !== MainThreadMessageType.MessengerTransfer) return;
        await callback(messengers[(body as MainThreadMessengerTransferBody).data.__messengerID]);
    };

    parentPort!.on('message', handler);

    return () => parentPort!.off('message', handler);
}

/**
 * Receive data streams from the main thread.
 *
 * @param callback The callback to run once the stream has been initialized and is ready to consume.
 */
function onStream(callback: OnStreamCallback<Exclude<typeof parentPort, null>>) {
    assertIsNotMainThread('ParentThread.onStream');
    return listenForStream(parentPort!, callback);
}

/**
 * Create a {@link Writable} instance that can be piped into in order to stream data to
 * the main thread. The main thread can listen for incoming streams with the
 * `service.onStream()` listener.
 *
 * @param metaData Any specific data about the stream that should be accessible when
 * using it.
 */
async function createStream(metaData?: Record<any, any>) {
    assertIsNotMainThread('ParentThread.stream');

    return prepareWritableToPortStream(parentPort!, metaData ?? {});
}

/**
 * An object containing functions to be used within workers when communicating with the main thread.
 *
 * @example
 * ParentThread.sendMessage('hello from worker!');
 *
 * ParentThread.onMessage<Record<string, string>>((data) => {
 *     console.log(Object.values(data));
 * });
 */
export const ParentThread = Object.freeze({
    sendMessage,
    onMessage,
    onMessengerReceived,
    waitForMessage,
    onStream,
    createStream,
});
