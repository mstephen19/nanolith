import { parentPort, workerData, threadId } from 'worker_threads';
import { MainThreadMessageType, WorkerMessageType } from '../types/messages.js';
import { applyMessengerTransferObjects } from './utilities.js';
import { Messenger } from '../messenger/index.js';

import type { TaskDefinitions } from '../types/definitions.js';
import type {
    MainThreadBaseMessageBody,
    WorkerCallReturnMessageBody,
    MainThreadCallMessageBody,
    WorkerCallErrorMessageBody,
    MainThreadMessengerTransferBody,
    WorkerMessengerTransferSuccessBody,
    WorkerExceptionMessageBody,
    WorkerInitializedMessageBody,
} from '../types/messages.js';
import type { ServiceWorkerData } from '../types/worker_data.js';

/**
 * Handles only service workers.
 */
export async function serviceWorkerHandler<Definitions extends TaskDefinitions>(definitions: Definitions) {
    process.on('uncaughtException', (err) => {
        const body: WorkerExceptionMessageBody = {
            type: WorkerMessageType.WorkerException,
            data: err,
        };

        parentPort!.postMessage(body);
    });

    // This listener is a priority, so should be added first
    parentPort!.on('message', async (body: MainThreadBaseMessageBody) => {
        switch (body?.type) {
            // Exit the worker's process when the terminate message is sent
            case MainThreadMessageType.Terminate:
                process.exit();
                break;
            // Handle calling a task within a service worker with message passing
            case MainThreadMessageType.Call: {
                try {
                    const { name, params, key } = body as MainThreadCallMessageBody;

                    if (!definitions?.[name] || typeof definitions[name] !== 'function') {
                        throw new Error(`A task with the name ${name} doesn't exist!`);
                    }

                    await definitions['__beforeServiceTask']?.(threadId);

                    const data = await definitions[name](...params);

                    const response: WorkerCallReturnMessageBody = {
                        type: WorkerMessageType.CallReturn,
                        key,
                        data,
                    };

                    parentPort!.postMessage(response);

                    await definitions['__afterServiceTask']?.(threadId);
                } catch (error) {
                    // Don't exit the process, instead post back a message with the error
                    const response: WorkerCallErrorMessageBody = {
                        type: WorkerMessageType.CallError,
                        key: (body as MainThreadCallMessageBody).key,
                        data: error as Error,
                    };

                    parentPort!.postMessage(response);
                }
                break;
            }
            case MainThreadMessageType.MessengerTransfer: {
                const { data } = body as MainThreadMessengerTransferBody;

                (workerData as ServiceWorkerData).messengers[data.__messengerID] = new Messenger(data);

                // Send a confirmation that the messenger data was received and processed
                // by the callback above.
                const postBody: WorkerMessengerTransferSuccessBody = {
                    type: WorkerMessageType.MessengerTransferSuccess,
                    data: (body as MainThreadMessengerTransferBody).data.__messengerID,
                };

                parentPort?.postMessage(postBody);
                break;
            }
            default:
                break;
        }
    });

    const { messengerTransfers } = workerData as ServiceWorkerData;
    // Turn the MessengerTransferData objects back into Messenger instances
    // and make them available on the "messengers" property on workerData
    if (messengerTransfers.length) applyMessengerTransferObjects(messengerTransfers);

    // If provided an initialization hook, run it.
    await definitions['__initializeService']?.(threadId);

    // Notify the main thread that the worker has initialized.
    parentPort?.postMessage({
        type: WorkerMessageType.Initialized,
    } as WorkerInitializedMessageBody);
}
