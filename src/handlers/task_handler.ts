import { workerData, parentPort } from 'worker_threads';
import { WorkerMessageType } from '../types/messages.js';

import type { TaskDefinitions } from '../types/definitions.js';
import type { WorkerTaskReturnMessageBody, WorkerTaskErrorMessageBody, WorkerExceptionMessageBody } from '../types/messages.js';
import type { TaskWorkerData } from '../types/worker_data.js';
import { applyMessengerTransferObjects } from './utilities.js';

/**
 * Handles only task workers.
 */
export async function taskWorkerHandler<Definitions extends TaskDefinitions>(definitions: Definitions) {
    process.on('uncaughtException', (err) => {
        const body: WorkerExceptionMessageBody = {
            type: WorkerMessageType.WorkerException,
            data: err,
        };

        parentPort!.postMessage(body);
    });

    try {
        const { name, params, messengerTransfers } = workerData as TaskWorkerData;

        // Turn the MessengerTransferData objects back into Messenger instances
        // and make them available on the "messengers" property on workerData
        if (messengerTransfers.length) applyMessengerTransferObjects(messengerTransfers);

        if (!definitions?.[name] || typeof definitions[name] !== 'function') {
            throw new Error(`A task with the name ${name} doesn't exist!`);
        }

        // Run the before hook if present
        if ('__beforeTask' in definitions && typeof definitions['__beforeTask'] === 'function') {
            await definitions['__beforeTask']();
        }

        // Run the task function
        const data = await definitions[name](...params);

        const body: WorkerTaskReturnMessageBody = {
            type: WorkerMessageType.TaskReturn,
            data,
        };

        // Send the return value back to the main thread
        parentPort!.postMessage(body);

        // Run the after hook if present
        if ('__afterTask' in definitions && typeof definitions['__afterTask'] === 'function') {
            await definitions['__afterTask']();
        }
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
