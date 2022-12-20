import type { Messenger } from '../messenger/index.js';
import type { MessengerTransferData } from './messenger.js';
import type { WorkerType } from '@constants/workers.js';

/**
 * The `workerData` which will be sent along in every single worker.
 */
export type BaseWorkerData<Type extends WorkerType = WorkerType> = {
    type: Type;
    identifier: string;
    messengerTransfers: MessengerTransferData[];
    messengers: Record<string, Messenger>;
};

/**
 * The `workerData` which will only be sent along for task workers.
 */
export type TaskWorkerData = {
    name: string;
    params: any[];
} & BaseWorkerData<WorkerType.Task>;

/**
 * The `workerData` which will only be sent along for service workers.
 */
export type ServiceWorkerData = BaseWorkerData<WorkerType.Service>;
