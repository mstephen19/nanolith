import { workerData } from 'worker_threads';
import { Messenger } from '@messenger';

import type { MessengerRawData } from '@typing/messenger.js';
import type { BaseWorkerData } from '@typing/worker_data.js';

export const applyMessengerTransferObjects = (messengerTransfers: MessengerRawData[]) => {
    (workerData as BaseWorkerData).messengers = messengerTransfers.reduce((acc, transfer) => {
        return {
            ...acc,
            [transfer.__messengerID]: new Messenger(transfer),
        };
    }, {} as Record<string, Messenger>);
};
