import { isMainThread, workerData } from 'worker_threads';
import { workerHandler } from '@handlers';
import { runTaskWorker, runServiceWorker } from '@runners';
import { assertCurrentFileNotEqual, getCurrentFile, getAutoIdentifier } from './utilities.js';

import type { DefineOptions, TaskDefinitions, Tasks } from '@typing/definitions.js';
import type { Nanolith } from '@typing/nanolith.js';
import type { ServiceWorkerOptions, TaskWorkerOptions } from '@typing/workers.js';
import type { CleanKeyOf, CleanReturnType } from '@typing/utilities.js';
import type { BaseWorkerData } from '@typing/worker_data.js';

/**
 * It all starts here 😎
 *
 * @param definitions A set of named function definitions. The functions you provide can be either synchronous or asynchronous.
 * @param options An optional set of {@link DefineOptions}. The `file` can be specified (if necessary),
 * as well as a unique `identifier` for the set of definitions.
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
 * });
 */
export async function define<Definitions extends TaskDefinitions>(
    definitions: Definitions,
    { identifier, file: fileFromOptions, safeMode = true }: DefineOptions = {}
): Promise<Nanolith<Definitions>> {
    // If a custom identifier was provided, use that. Otherwise, use the auto-generated one.
    const identifierToUse = identifier || getAutoIdentifier(definitions);

    // If we are not on the main thread, run the worker.
    if (!isMainThread) {
        // If the identifier in the workerData is not equal to the identifier provided
        // in the options of the "define" function, return out immediately.
        const { identifier: workerIdentifier } = workerData as BaseWorkerData;
        // If the identifier for the call is not equal to the one passed into this set of definitions,
        // don't use this set of definitions - they are trying to use a different set.
        if (workerIdentifier !== identifierToUse) return undefined as any as Nanolith<Definitions>;

        // Otherwise, this is the set of definitions that is meant to be used, and the worker
        // can be handled accordingly.
        await workerHandler(definitions);
        // Since we're not running on the main thread, we can safely coerce "undefined" into
        // our Nanolith API type. Worker handler will always exit the process anyways, so this
        // is only here to make the TypeScript compiler happy.
        return undefined as any as Nanolith<Definitions>;
    }

    // Determine the file of the worker if it was not provided in the options.
    const file = fileFromOptions ?? getCurrentFile();

    return Object.freeze(
        Object.assign(
            async <Name extends CleanKeyOf<Tasks<Definitions>>>(options: TaskWorkerOptions<Name, Parameters<Definitions[Name]>>) => {
                if (safeMode) assertCurrentFileNotEqual(file);
                return runTaskWorker(file, identifierToUse, options as TaskWorkerOptions) as Promise<CleanReturnType<Definitions[Name]>>;
            },
            {
                launchService: Object.freeze(async <Options extends ServiceWorkerOptions>(options = {} as Options) => {
                    if (safeMode) assertCurrentFileNotEqual(file);
                    return runServiceWorker<Definitions, Options>(file, identifierToUse, options);
                }),
                file,
            }
        )
    );
}
