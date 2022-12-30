import type { Messenger } from '@messenger';
import type { MessengerRawData } from './messenger.js';
import type { WorkerType } from '@constants/workers.js';

/**
 * The `workerData` which will be sent along in every single worker.
 */
export type BaseWorkerData<Type extends WorkerType = WorkerType> = {
    type: Type;
    identifier: string;
    messengerTransfers: MessengerRawData[];
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
