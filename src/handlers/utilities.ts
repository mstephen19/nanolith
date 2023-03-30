import { workerData } from 'worker_threads';
import { Messenger } from '@messenger';

import type { MessengerRawData } from '@typing/messenger.js';
import type { BaseWorkerData } from '@typing/worker_data.js';

export const applyMessengerTransferObjects = (messengerTransfers: MessengerRawData[]) => {
    (workerData as BaseWorkerData).messengers = messengerTransfers.reduce((acc, transfer) => {
        acc[transfer.__messengerID] = new Messenger(transfer);
        return acc;
    }, {} as Record<string, Messenger>);
};
