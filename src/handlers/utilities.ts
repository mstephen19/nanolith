import { workerData } from 'worker_threads';
import { Messenger } from '../messenger/index.js';

import type { MessengerTransferData } from '../types/messenger.js';
import type { BaseWorkerData } from '../types/worker_data.js';

export const applyMessengerTransferObjects = (messengerTransfers: MessengerTransferData[]) => {
    (workerData as BaseWorkerData).messengers = messengerTransfers.reduce((acc, transfer) => {
        return {
            ...acc,
            [transfer.__messengerID]: new Messenger(transfer),
        };
    }, {} as Record<string, Messenger>);
};
