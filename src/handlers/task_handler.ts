import { workerData, parentPort, threadId } from 'worker_threads';
import { WorkerMessageType } from '@typing/messages.js';
import { applyMessengerTransferObjects } from './utilities.js';

import type { TaskDefinitions } from '@typing/definitions.js';
import type { WorkerTaskReturnMessageBody, WorkerTaskErrorMessageBody, WorkerExceptionMessageBody } from '@typing/messages.js';
import type { TaskWorkerData } from '@typing/worker_data.js';

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

        if (!definitions?.[name] || typeof definitions[name] !== 'function') {
            throw new Error(`A task with the name ${name} doesn't exist!`);
        }

        // Turn the MessengerTransferData objects back into Messenger instances
        // and make them available on the "messengers" property on workerData
        if (messengerTransfers.length) applyMessengerTransferObjects(messengerTransfers);

        // Run the before hook if present
        await definitions['__beforeTask']?.(threadId);

        // Run the task function
        const data = await definitions[name](...params);

        const body: WorkerTaskReturnMessageBody = {
            type: WorkerMessageType.TaskReturn,
            data,
        };

        // Send the return value back to the main thread
        parentPort!.postMessage(body);

        // Run the after hook if present
        await definitions['__afterTask']?.(threadId);
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
