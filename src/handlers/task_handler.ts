import { workerData, parentPort } from 'worker_threads';
import { WorkerMessageType } from '../types/messages.js';

import type { TaskDefinitions } from '../types/definitions.js';
import type { WorkerTaskReturnMessageBody, WorkerTaskErrorMessageBody } from '../types/messages.js';
import type { TaskWorkerData } from '../types/worker_data.js';

/**
 * Handles only task workers.
 */
export async function taskWorkerHandler<Definitions extends TaskDefinitions>(definitions: Definitions) {
    try {
        const { name, params } = workerData as TaskWorkerData;

        if (!definitions?.[name] || typeof definitions[name] !== 'function') {
            throw new Error(`A task with the name ${name} doesn't exist!`);
        }

        const data = await definitions[name](...params);

        const body: WorkerTaskReturnMessageBody = {
            type: WorkerMessageType.TaskReturn,
            data,
        };

        parentPort!.postMessage(body);
    } catch (error) {
        const body: WorkerTaskErrorMessageBody = {
            type: WorkerMessageType.TaskError,
            data: error as Error,
        };

        parentPort!.postMessage(body);
    } finally {
        process.exit();
    }
}
