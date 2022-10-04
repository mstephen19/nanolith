import type { TransferListItem } from 'worker_threads';
import type { Messenger } from '../messenger/messenger.js';
import type { WorkerOptions } from './config.js';
import type { Awaitable } from './utilities.js';

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
    /**
     * The name of the task to call. Must be present on the set of definitions created within
     * the `define` function.
     */
    name: Name;
} & (Params['length'] extends 0
    ? { params?: undefined }
    : {
          /**
           * The parameters for the task in array form.
           */
          params: Params;
      });

export type ServiceCallOptions<Name extends string = string, Params extends any[] = any[]> = {
    /**
     * An optional array of {@link TransferListItem}s. See the
     * [Node.js documentation](https://nodejs.org/api/worker_threads.html#workerpostmessagevalue-transferlist) for more information.
     */
    transferList?: readonly TransferListItem[];
} & CallOptions<Name, Params>;

/**
 * The base options that are available when spinning up either a task or a service.
 */
export type BaseWorkerOptions = {
    /**
     * An object containing *most* of the options available on the `Worker` constructor. See the
     * [Node.js documentation](https://nodejs.org/api/worker_threads.html#new-workerfilename-options) to
     * understand all of these options.
     */
    options?: WorkerOptions;
    /**
     * Whether or not to treat the worker as priority over the others when being queued into the `pool`.
     */
    priority?: boolean;
    /**
     * When `true`, [`worker.ref()`](https://nodejs.org/api/worker_threads.html#workerref) will be called.
     * When `false`, [`worker.unref()`](https://nodejs.org/api/worker_threads.html#workerunref) will be called.
     */
    reffed?: boolean;
    /**
     * An array of {@link Messenger}s that should be accessible to the worker when it is running.
     */
    messengers?: Messenger[];
};

/**
 * The options for spinning up a task worker.
 */
export type TaskWorkerOptions<Name extends string = string, Params extends any[] = any[]> = CallOptions<Name, Params> & BaseWorkerOptions;

export type ExceptionHandlerContext = {
    /**
     * An `Error` object containing the error that was thrown in the worker.
     */
    error: Error;
    /**
     * An asynchronous function that can be used to exit the service's process.
     */
    terminate: () => Promise<void>;
};

/**
 * The options for spinning up a service worker that can run multiple tasks.
 */
export type ServiceWorkerOptions = BaseWorkerOptions & {
    /**
     * An optional but recommended option that allows for the catching of uncaught exceptions
     * within the service.
     */
    exceptionHandler?: ({ error, terminate }: ExceptionHandlerContext) => Awaitable<void>;
};
