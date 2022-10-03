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

export enum ConcurrencyOption {
    /**
     * One thread per four cores.
     */
    Quarter = 'Quarter',
    /**
     * One thread per two cores.
     */
    Half = 'Half',
    /**
     * Default concurrency. One thread per core (`x1`).
     */
    Default = 'x1',
    /**
     * One thread per core.
     */
    x1 = 'x1',
    /**
     * Two threads per core.
     */
    x2 = 'x2',
    /**
     * Four threads per core.
     */
    x4 = 'x4',
    /**
     * Six threads per core.
     */
    x6 = 'x6',
}
