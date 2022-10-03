import { isMainThread, workerData } from 'worker_threads';
import { workerHandler } from '../handlers/index.js';
import callsites from 'callsites';
import { runTaskWorker } from './run_task_worker.js';
import { runServiceWorker } from './run_service_worker.js';
import { fileURLToPath } from 'url';

import type { DefineOptions, TaskDefinitions } from '../types/definitions.js';
import type { Nanolith } from '../types/nanolith.js';
import type { ServiceWorkerOptions, TaskWorkerOptions } from '../types/workers.js';
import type { CleanKeyOf, CleanReturnType } from '../types/utilities.js';
import type { BaseWorkerData } from '../types/worker_data.js';

/**
 * It all starts here.
 */
export async function define<Definitions extends TaskDefinitions>(
    definitions: Definitions,
    { identifier = 'default', file: fileFromOptions }: DefineOptions = {}
): Promise<Nanolith<Definitions>> {
    // If we are not on the main thread, run the worker.
    if (!isMainThread) {
        // If the identifier in the workerData is not equal to the identifier provided
        // in the options of the "define" function, return out immediately.
        const { identifier: workerIdentifier } = workerData as BaseWorkerData;
        if (workerIdentifier !== identifier) return undefined as any as Nanolith<Definitions>;

        await workerHandler(definitions);
        return undefined as any as Nanolith<Definitions>;
    }

    // Determine the file of the worker if it was not provided in the options.
    const file = fileFromOptions ?? fileURLToPath(callsites()[1].getFileName()!);

    return Object.freeze(
        Object.assign(
            async <Name extends CleanKeyOf<Definitions>>(options: TaskWorkerOptions<Name, Parameters<Definitions[Name]>>) => {
                return runTaskWorker(file, identifier, options as TaskWorkerOptions) as Promise<CleanReturnType<Definitions[Name]>>;
            },
            {
                launchService: Object.freeze(async <Options extends ServiceWorkerOptions>(options = {} as Options) => {
                    return runServiceWorker<Definitions, Options>(file, identifier, options);
                }),
            }
        )
    );
}
