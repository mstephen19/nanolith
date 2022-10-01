import { isMainThread, workerData } from 'worker_threads';
import { taskWorkerHandler } from './task_handler.js';
import { serviceWorkerHandler } from './service_handler.js';
import { WorkerType } from '../types/workers.js';

import type { TaskDefinitions } from '../types/definitions.js';
import type { BaseWorkerData } from '../types/worker_data';

/**
 * Handles the entire worker process.
 */
export async function workerHandler<Definitions extends TaskDefinitions>(definitions: Definitions) {
    // We only want to handle the file as worker if this function isn't being run on the main thread.
    if (isMainThread) return;

    const { type } = workerData as BaseWorkerData;

    switch (type) {
        case WorkerType.Task: {
            await taskWorkerHandler(definitions);
            break;
        }
        case WorkerType.Service: {
            await serviceWorkerHandler(definitions);
            break;
        }
        default: {
            process.exit(0);
        }
    }
}
