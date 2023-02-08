import { workerData, parentPort } from 'worker_threads';
import { WorkerMessageType } from '@constants/messages.js';
import { applyMessengerTransferObjects } from './utilities.js';

import type { TaskDefinitions } from '@typing/definitions.js';
import type { WorkerTaskReturnMessageBody, WorkerTaskErrorMessageBody, WorkerExceptionMessageBody } from '@typing/messages.js';
import type { TaskWorkerData } from '@typing/worker_data.js';
import { WorkerExitCode } from '@constants/workers.js';

/**
 * Handles only task workers.
 */
export async function taskWorkerHandler<Definitions extends TaskDefinitions>(definitions: Definitions) {
    process.prependListener('uncaughtException', (err) => {
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
        await definitions['__beforeTask']?.({ name, inService: false });

        // Run the task function
        const data = await definitions[name](...params);

        // Run the after hook if present
        await definitions['__afterTask']?.({ name, inService: false });

        const body: WorkerTaskReturnMessageBody = {
            type: WorkerMessageType.TaskReturn,
            data,
        };

        // Send the return value back to the main thread
        parentPort!.postMessage(body);
    } catch (error) {
        const body: WorkerTaskErrorMessageBody = {
            type: WorkerMessageType.TaskError,
            data: error as Error,
        };

        parentPort!.postMessage(body);
    } finally {
        process.exit(WorkerExitCode.Ok);
    }
}
