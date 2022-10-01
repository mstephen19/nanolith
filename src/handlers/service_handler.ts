import { parentPort } from 'worker_threads';
import { MainThreadMessageType, WorkerCallErrorMessageBody, WorkerMessageType } from '../types/messages.js';

import type { TaskDefinitions } from '../types/definitions.js';
import type { MainThreadBaseMessageBody, WorkerCallReturnMessageBody, MainThreadCallMessageBody } from '../types/messages.js';

/**
 * Handles only service workers.
 */
export async function serviceWorkerHandler<Definitions extends TaskDefinitions>(definitions: Definitions) {
    parentPort!.on('message', async (body: MainThreadBaseMessageBody) => {
        // Exit the worker's process when the terminate message is sent
        if (body?.type === MainThreadMessageType.Terminate) process.exit();

        // Handle calling a task within a service worker with message passing
        if (body?.type === MainThreadMessageType.Call) {
            try {
                const { name, params, key } = body as MainThreadCallMessageBody;

                if (!definitions?.[name] || typeof definitions[name] !== 'function') {
                    throw new Error(`A task with the name ${name} doesn't exist!`);
                }

                const data = await definitions[name](...params);

                const response: WorkerCallReturnMessageBody = {
                    type: WorkerMessageType.CallReturn,
                    key,
                    data,
                };

                parentPort!.postMessage(response);
            } catch (error) {
                // Don't exit the process, instead post back a message with the error
                const response: WorkerCallErrorMessageBody = {
                    type: WorkerMessageType.CallError,
                    key: (body as MainThreadCallMessageBody).key,
                    data: error as Error,
                };

                parentPort!.postMessage(response);
            }
        }
    });
}
