import { isMainThread, workerData } from 'worker_threads';
import { workerHandler } from '../handlers/index.js';
import { runTaskWorker } from '../runners/index.js';
import { runServiceWorker } from '../runners/index.js';
import { assertCurrentFileNotEqual, getCurrentFile } from './utilities.js';

import type { DefineOptions, TaskDefinitions, Tasks } from '../types/definitions.js';
import type { Nanolith } from '../types/nanolith.js';
import type { ServiceWorkerOptions, TaskWorkerOptions } from '../types/workers.js';
import type { CleanKeyOf, CleanReturnType } from '../types/utilities.js';
import type { BaseWorkerData } from '../types/worker_data.js';

/**
 * It all starts here 😎
 *
 * @param definitions A set of named function definitions. The functions you provide can be either synchronous or asynchronous.
 * @param options An optional set of {@link DefineOptions}. The `file` can be specified (if necessary),
 * as well as a unique `identifier` for the set of definitions.
 *
 *
 *
 * @example
 * import { define } from 'nanolith';
 *
 * export const math = await define({
 *     add: (x: number, y: number) => x + y,
 *     subtract: (x: number, y: number) => x - y,
 *     waitThenAdd: async (x: number, y: number) => {
 *         await new Promise((resolve) => setTimeout(resolve, 5000));
 *         return x + y;
 *     }.
 * }, {
 *     identifier: 'mathService'
 * });
 */
export async function define<Definitions extends TaskDefinitions>(
    definitions: Definitions,
    { identifier = 'default', file: fileFromOptions, safeMode = true }: DefineOptions = {}
): Promise<Nanolith<Definitions>> {
    // If we are not on the main thread, run the worker.
    if (!isMainThread) {
        // If the identifier in the workerData is not equal to the identifier provided
        // in the options of the "define" function, return out immediately.
        const { identifier: workerIdentifier } = workerData as BaseWorkerData;
        if (workerIdentifier !== identifier) return undefined as any as Nanolith<Definitions>;

        // Otherwise, this is the set of definitions that is meant to be used, and the worker
        // can be handled accordingly.
        await workerHandler(definitions);
        // Since we're not running on the main thread, we can safely coerce "undefined" into
        // our Nanolith API type.
        return undefined as any as Nanolith<Definitions>;
    }

    // Determine the file of the worker if it was not provided in the options.
    const file = fileFromOptions ?? getCurrentFile();

    return Object.freeze(
        Object.assign(
            async <Name extends CleanKeyOf<Tasks<Definitions>>>(options: TaskWorkerOptions<Name, Parameters<Definitions[Name]>>) => {
                if (safeMode) assertCurrentFileNotEqual(file);
                return runTaskWorker(file, identifier, options as TaskWorkerOptions) as Promise<CleanReturnType<Definitions[Name]>>;
            },
            {
                launchService: Object.freeze(async <Options extends ServiceWorkerOptions>(options = {} as Options) => {
                    if (safeMode) assertCurrentFileNotEqual(file);
                    return runServiceWorker<Definitions, Options>(file, identifier, options);
                }),
                file,
            }
        )
    );
}
