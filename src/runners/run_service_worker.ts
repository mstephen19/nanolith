import { PoolItem, pool } from '../pool/index.js';
import { WorkerType } from '../types/workers.js';
import { Service } from '../service/index.js';
import { WorkerMessageType } from '../types/messages.js';
import { getCurrentFile } from '../define/utilities.js';

import type { ServiceWorkerOptions } from '../types/workers.js';
import type { TaskDefinitions } from '../types/definitions.js';
import type { WorkerBaseMessageBody, WorkerExceptionMessageBody } from '../types/messages.js';

export const runServiceWorker = async <Definitions extends TaskDefinitions, Options extends ServiceWorkerOptions>(
    file: string,
    identifier: string,
    { exceptionHandler, ...rest }: Options
) => {
    if (getCurrentFile(3) === file) throw new Error('Cannot run services from the same file from which their tasks were defined!');

    const item = new PoolItem({
        file,
        workerData: {
            type: WorkerType.Service,
            identifier,
        },
        ...rest,
    });

    const promise = new Promise((resolve, reject) => {
        item.on('created', (worker) => {
            worker.on('error', reject);

            const handleInitialization = (body: WorkerBaseMessageBody) => {
                if (body.type !== WorkerMessageType.Initialized) return;

                const service = new Service(worker);
                // Register the listener for the exception handler
                if (exceptionHandler && typeof exceptionHandler === 'function') {
                    worker.on('message', async (body: WorkerBaseMessageBody) => {
                        if (body.type !== WorkerMessageType.WorkerException) return;
                        await exceptionHandler({
                            error: (body as WorkerExceptionMessageBody).data,
                            terminate: service.close.bind(service),
                        });
                    });
                }

                // Resolve with a Service API instance
                resolve(service);

                // Clean up listeners
                worker.off('error', reject);
                worker.off('message', handleInitialization);
            };

            worker.on('message', handleInitialization);
        });
    }) as Promise<Service<Definitions>>;

    pool.enqueue(item);

    return promise;
};
