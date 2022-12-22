import type { TransferListItem, ResourceLimits } from 'worker_threads';

export type WorkerOptions = {
    /**
     * List of arguments which would be stringified and appended to `process.argv` in the worker. This is mostly similar to the `workerData` but the values are available on the global `process.argv` as if they were passed as CLI options to the script.
     */
    argv?: any[];
    /**
     * List of node CLI options passed to the worker. V8 options (such as `--max-old-space-size`) and options that affect the process (such as `--title`) are not supported. If set, this is provided as [`process.execArgv`](https://nodejs.org/api/process.html#processexecargv) inside the worker. By default, options are inherited from the parent thread.
     */
    execArgv?: string[];
    /**
     * If this is set to `true`, then `worker.stdin` provides a writable stream whose contents appear as `process.stdin` inside the Worker. By default, no data is provided.
     */
    stdin?: boolean;
    /**
     * If this is set to `true`, then `worker.stdout` is not automatically piped through to `process.stdout` in the parent.
     */
    stdout?: boolean;
    /**
     * If this is set to true, then `worker.stderr` is not automatically piped through to `process.stderr` in the parent.
     */
    stderr?: boolean;
    /**
     * If this is set to `true`, then the Worker tracks raw file descriptors managed through [`fs.open()`](https://nodejs.org/api/fs.html#fsopenpath-flags-mode-callback) and [`fs.close()`](https://nodejs.org/api/fs.html#fsclosefd-callback), and closes them when the Worker exits, similar to other resources like network sockets or file descriptors managed through the [`FileHandle`](https://nodejs.org/api/fs.html#class-filehandle) API. This option is automatically inherited by all nested Workers.
     *
     * **Default:** `true`.
     */
    trackUnmanagedFds?: boolean;
    /**
     * If one or more `MessagePort`-like objects are passed in workerData, a `transferList` is required for those items or [`ERR_MISSING_MESSAGE_PORT_IN_TRANSFER_LIST`](https://nodejs.org/api/errors.html#err_missing_message_port_in_transfer_list) is thrown. See [`port.postMessage()`](https://nodejs.org/api/worker_threads.html#portpostmessagevalue-transferlist) for more information.
     */
    transferList?: TransferListItem[];
    /**
     * An optional set of resource limits for the new JS engine instance. Reaching these limits leads to termination of the Worker instance. These limits only affect the JS engine, and no external data, including no [`ArrayBuffers`]. Even if these limits are set, the process may still abort if it encounters a global out-of-memory situation.
     */
    resourceLimits?: ResourceLimits;
};
