import { parentPort, workerData } from 'worker_threads';
import { MainThreadMessageType, WorkerMessageType } from '../types/messages.js';
import { assertIsNotMainThread } from '../utilities/index.js';

import type { TransferListItem } from 'worker_threads';
import type { Awaitable } from '../types/utilities.js';
import type {
    WorkerSendMessageBody,
    MainThreadBaseMessageBody,
    MainThreadSendMessageBody,
    MainThreadMessengerTransferBody,
} from '../types/messages.js';
import type { Messenger } from '../messenger/index.js';
import type { BaseWorkerData } from '../types/worker_data.js';

/**
 *
 * @param data The data to send to the main thread.
 * @param transferList An optional array of {@link TransferListItem}s. See the
 * [Node.js documentation](https://nodejs.org/api/worker_threads.html#workerpostmessagevalue-transferlist) for more information.
 *
 * @example
 * parent.sendMessage('foo');
 * parent.sendMessage({ hello: 'world' });
 */
function sendMessage<Data = any>(data: Data, transferList?: readonly TransferListItem[]) {
    assertIsNotMainThread('parent.sendMessage');

    const body: WorkerSendMessageBody<Data> = {
        type: WorkerMessageType.Message,
        data,
    };

    parentPort?.postMessage(body, transferList);
}

/**
 * Listen for messages coming from the main thread.
 *
 * @param callback A function to run each time a message is received from the main thread.
 *
 * @example
 * parent.onMessage<string>((data) => console.log(data, 'received!'));
 */
function onMessage<Data = any>(callback: (body: Data) => Awaitable<void>) {
    assertIsNotMainThread('parent.onMessage');

    parentPort?.on('message', async (body: MainThreadBaseMessageBody) => {
        if (body.type !== MainThreadMessageType.Message) return;
        await callback((body as MainThreadSendMessageBody<Data>).data);
    });
}

/**
 * Remove a function from the list of callbacks to be run when a message is received from the main thread.
 *
 * @param callback The function to remove.
 *
 * @example
 * const callback = (data: string) => console.log(data, 'received!');
 *
 * parent.onMessage(callback);
 *
 * // ...later...
 * parent.offMessage(callback);
 */
function offMessage<Data = any>(callback: (body: Data) => Awaitable<void>) {
    assertIsNotMainThread('parent.offMessage');

    parentPort?.off('message', callback);
}

/**
 * Listen for {@link Messenger}s being sent to the worker from the main thread.
 *
 * @param callback A function to run each time a `Messenger` is received from the main thread.
 *
 * @example
 * parent.onMessengerReceived((messenger) => console.log(messenger.ID));
 */
function onMessengerReceived(callback: (messenger: Messenger) => Awaitable<any>) {
    assertIsNotMainThread('parent.onMessengerReceived');

    const { messengers } = workerData as BaseWorkerData;

    parentPort?.on('message', async (body: MainThreadBaseMessageBody) => {
        if (body.type !== MainThreadMessageType.MessengerTransfer) return;
        await callback(messengers[(body as MainThreadMessengerTransferBody).data.__messengerID]);
    });
}

/**
 *
 * An object containing functions to be used within workers when communicating with the main thread.
 *
 * @example
 * parent.sendMessage('hello from worker!');
 *
 * parent.onMessage<Record<string, string>>((data) => {
 *     console.log(Object.values(data));
 * });
 */
export const parent = Object.freeze({
    sendMessage,
    onMessage,
    offMessage,
    onMessengerReceived,
});
