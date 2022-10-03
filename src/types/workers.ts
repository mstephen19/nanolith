import type { TransferListItem } from 'worker_threads';
import type { WorkerOptions } from './config.js';

/**
 * The types of workers supported by the library.
 */
export const enum WorkerType {
    Task,
    Service,
}

/**
 * The base options for calling a task. These are the options for calling a task within
 * a service, and they are extended by `BaseWorkerOptions` for calling a task as its own
 * worker.
 */
export type CallOptions<Name extends string = string, Params extends any[] = any[]> = {
    name: Name;
} & (Params['length'] extends 0 ? { params?: undefined } : { params: Params });

export type ServiceCallOptions<Name extends string = string, Params extends any[] = any[]> = {
    transferList?: readonly TransferListItem[];
} & CallOptions<Name, Params>;

/**
 * The base options that are available when spinning up either a task or a service.
 */
export type BaseWorkerOptions = {
    options?: WorkerOptions;
    priority?: boolean;
    reffed?: boolean;
};

/**
 * The options for spinning up a task worker.
 */
export type TaskWorkerOptions<Name extends string = string, Params extends any[] = any[]> = CallOptions<Name, Params> & BaseWorkerOptions;

/**
 * The options for spinning up a service worker that can run multiple tasks.
 */
export type ServiceWorkerOptions = BaseWorkerOptions;
