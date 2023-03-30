import { PoolItem, pool } from '@pool';
import { WorkerType } from '@constants/workers.js';
import { Service } from '@service';
import { WorkerMessageType } from '@constants/messages.js';

import type { ExitCode, ServiceWorkerOptions } from '@typing/workers.js';
import type { TaskDefinitions } from '@typing/definitions.js';
import type { WorkerBaseMessageBody, WorkerExceptionMessageBody } from '@typing/messages.js';

export const runServiceWorker = async <Definitions extends TaskDefinitions, Options extends ServiceWorkerOptions>(
    file: string,
    identifier: string,
    { exceptionHandler, ...rest }: Options
) => {
    const item = new PoolItem({
        file,
        workerData: {
            type: WorkerType.Service,
            identifier,
        },
        ...rest,
    });

    const promise = new Promise((resolve, reject) => {
        item.once('created', (worker) => {
            worker.on('error', reject);

            // Ensure the Service instance has initialized and the
            // __initializeService hook has completed before creating the
            // service and resolving with it.
            const handleInitialization = (body: WorkerBaseMessageBody) => {
                if (body.type !== WorkerMessageType.Initialized) return;

                const service = Object.seal(new Service(worker));
                // Register the listener for the exception handler
                if (typeof exceptionHandler === 'function') {
                    worker.on('message', async (body: WorkerBaseMessageBody) => {
                        if (body.type !== WorkerMessageType.WorkerException) return;
                        await exceptionHandler({
                            error: (body as WorkerExceptionMessageBody).data,
                            terminate: (code?: ExitCode) => service.close(code),
                        });
                    });
                }

                // Clean up listeners before resolving to handle edge-case
                // slight performance decreases.
                worker.off('message', handleInitialization);
                worker.off('error', reject);

                // Resolve with a Service API instance
                resolve(service);
            };

            worker.on('message', handleInitialization);
        });
    }) as Promise<Service<Definitions>>;

    pool.__enqueue(item);

    return promise;
};
