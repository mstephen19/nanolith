import { parentPort, workerData, threadId } from 'worker_threads';
import { ParentThreadMessageType, WorkerMessageType } from '@constants/messages.js';
import { applyMessengerTransferObjects } from './utilities.js';
import { Messenger } from '@messenger';

import type { TaskDefinitions } from '@typing/definitions.js';
import type {
    ParentThreadBaseMessageBody,
    ParentThreadCallMessageBody,
    ParentThreadMessengerTransferBody,
    WorkerCallReturnMessageBody,
    WorkerCallErrorMessageBody,
    WorkerMessengerTransferSuccessBody,
    WorkerExceptionMessageBody,
    WorkerInitializedMessageBody,
    WorkerExitMessageBody,
} from '@typing/messages.js';
import type { ServiceWorkerData } from '@typing/worker_data.js';

/**
 * Handles only service workers.
 */
export async function serviceWorkerHandler<Definitions extends TaskDefinitions>(definitions: Definitions) {
    process.prependListener('uncaughtException', (err) => {
        const body: WorkerExceptionMessageBody = {
            type: WorkerMessageType.WorkerException,
            data: err,
        };

        parentPort!.postMessage(body);
    });

    process.on('exit', (code) => {
        const body: WorkerExitMessageBody = {
            type: WorkerMessageType.Exit,
            code,
        };

        parentPort?.postMessage(body);
    });

    // This listener is a priority, so should be added first
    parentPort!.on('message', async (body: ParentThreadBaseMessageBody) => {
        try {
            switch (body?.type) {
                // Handle calling a task within a service worker with message passing
                case ParentThreadMessageType.Call: {
                    const { name, params, key } = body as ParentThreadCallMessageBody;

                    if (!definitions?.[name] || typeof definitions[name] !== 'function') {
                        throw new Error(`A task with the name ${name} doesn't exist!`);
                    }

                    await definitions['__beforeTask']?.({ name, inService: true });

                    const data = await definitions[name](...params);

                    await definitions['__afterTask']?.({ name, inService: true });

                    const response: WorkerCallReturnMessageBody = {
                        type: WorkerMessageType.CallReturn,
                        key,
                        data,
                    };

                    parentPort!.postMessage(response);
                    break;
                }
                case ParentThreadMessageType.MessengerTransfer: {
                    const { data } = body as ParentThreadMessengerTransferBody;

                    (workerData as ServiceWorkerData).messengers[data.__messengerID] = new Messenger(data);

                    // Send a confirmation that the messenger data was received and processed
                    // by the callback above.
                    const postBody: WorkerMessengerTransferSuccessBody = {
                        type: WorkerMessageType.MessengerTransferSuccess,
                        data: (body as ParentThreadMessengerTransferBody).data.__messengerID,
                    };

                    parentPort?.postMessage(postBody);
                    break;
                }
                default:
                    return;
            }
        } catch (error) {
            // Don't exit the process, instead post back a message with the error
            const response: WorkerCallErrorMessageBody = {
                type: WorkerMessageType.CallError,
                key: (body as ParentThreadCallMessageBody).key,
                data: error as Error,
            };

            parentPort!.postMessage(response);
        }
    });

    const { messengerTransfers } = workerData as ServiceWorkerData;
    // Turn the MessengerTransferData objects back into Messenger instances
    // and make them available on the "messengers" property on workerData
    if (messengerTransfers.length) applyMessengerTransferObjects(messengerTransfers);

    // If provided an initialization hook, run it.
    await definitions['__initializeService']?.(threadId);

    // Notify the main thread that the worker has initialized.
    parentPort!.postMessage({
        type: WorkerMessageType.Initialized,
    } as WorkerInitializedMessageBody);
}
