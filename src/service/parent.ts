import { parentPort } from 'worker_threads';
import { MainThreadMessageType, WorkerMessageType } from '../types/messages.js';

import type { TransferListItem } from 'worker_threads';
import type { Awaitable } from '../types/utilities.js';
import type { WorkerSendMessageBody, MainThreadBaseMessageBody, MainThreadSendMessageBody } from '../types/messages.js';

function sendMessage<Data extends any = any>(data: Data, transferList?: readonly TransferListItem[]) {
    const body: WorkerSendMessageBody<Data> = {
        type: WorkerMessageType.Message,
        data,
    };

    parentPort?.postMessage(body, transferList);
}

function onMessage<Data extends any = any>(callback: (body: Data) => Awaitable<any>) {
    parentPort?.on('message', async (body: MainThreadBaseMessageBody) => {
        if (body.type !== MainThreadMessageType.Message) return;
        await callback((body as MainThreadSendMessageBody<Data>).data);
    });
}

function offMessage<Data extends any = any>(callback: (body: Data) => Awaitable<any>) {
    parentPort?.off('message', callback);
}

export const parent = {
    sendMessage,
    onMessage,
    offMessage,
};
