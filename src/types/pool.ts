import { WorkerOptions } from './config.js';
import type { BaseWorkerOptions, WorkerType } from './workers.js';

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
        type: WorkerType;
        name?: string;
        params?: any[];
    };
    options: WorkerOptions;
    priority: boolean;
    reffed: boolean;
} & BasePoolItemConfig;
