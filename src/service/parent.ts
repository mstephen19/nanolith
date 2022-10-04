import { parentPort, workerData } from 'worker_threads';
import { MainThreadMessageType, WorkerMessageType } from '../types/messages.js';

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

function sendMessage<Data extends any = any>(data: Data, transferList?: readonly TransferListItem[]) {
    const body: WorkerSendMessageBody<Data> = {
        type: WorkerMessageType.Message,
        data,
    };

    parentPort?.postMessage(body, transferList);
}

function onMessage<Data extends any = any>(callback: (body: Data) => Awaitable<void>) {
    parentPort?.on('message', async (body: MainThreadBaseMessageBody) => {
        if (body.type !== MainThreadMessageType.Message) return;
        await callback((body as MainThreadSendMessageBody<Data>).data);
    });
}

function offMessage<Data extends any = any>(callback: (body: Data) => Awaitable<void>) {
    parentPort?.off('message', callback);
}

function onMessengerReceived(callback: (messenger: Messenger) => Awaitable<any>) {
    const { messengers } = workerData as BaseWorkerData;

    parentPort?.on('message', async (body: MainThreadBaseMessageBody) => {
        if (body.type !== MainThreadMessageType.MessengerTransfer) return;
        await callback(messengers[(body as MainThreadMessengerTransferBody).data.__messengerID]);
    });
}

export const parent = {
    sendMessage,
    onMessage,
    offMessage,
    onMessengerReceived,
};
