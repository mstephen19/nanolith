import type { Worker } from 'worker_threads';
import type { WorkerOptions } from './misc.js';
import type { MessengerRawData } from './messenger.js';
import type { BaseWorkerOptions } from './workers.js';
import type { WorkerType } from '@constants/workers.js';
import type { Counter } from 'utilities/counter.js';
import type { SharedUint32 } from 'utilities/shared_uint32.js';

export type PoolData = {
    active: Counter;
    concurrency: SharedUint32;
};

export type PoolItemEvents = {
    created: (worker: Worker) => void;
};

export type BasePoolItemConfig = {
    file: string;
};

/**
 * Used to create a `PoolItem`.
 */
export type PoolItemConfig<Type extends WorkerType = WorkerType> = {
    workerData: Type extends WorkerType.Task
        ? {
              type: WorkerType.Task;
              identifier: string;
              name: string;
              params: any[];
          }
        : {
              type: WorkerType.Service;
              identifier: string;
          };
} & BaseWorkerOptions &
    BasePoolItemConfig;

/**
 * Used internally by the `PoolItem` class.
 */
export type PoolItemOptions = {
    workerData: {
        identifier: string;
        type: WorkerType;
        name?: string;
        params?: any[];
        messengerTransfers: MessengerRawData[];
        messengers: Record<string, never>;
    };
    options: WorkerOptions;
    priority: boolean;
    reffed: boolean;
    shareEnv: boolean;
} & BasePoolItemConfig;
