import { PoolItem, pool } from '../pool/index.js';
import { WorkerType } from '../types/workers.js';
import { Service } from '../service/index.js';
import { WorkerMessageType } from '../types/messages.js';

import type { ServiceWorkerOptions } from '../types/workers.js';
import type { TaskDefinitions } from '../types/definitions.js';
import type { WorkerBaseMessageBody, WorkerExceptionMessageBody } from '../types/messages.js';

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
        item.on('created', (worker) => {
            worker.on('error', reject);
            worker.on('online', () => {
                // Register the exception handler
                if (exceptionHandler && typeof exceptionHandler === 'function') {
                    worker.on('message', async (body: WorkerBaseMessageBody) => {
                        if (body.type !== WorkerMessageType.WorkerException) return;
                        exceptionHandler({ error: (body as WorkerExceptionMessageBody).data, terminate: worker.terminate });
                    });
                }

                // Resolve with a Service API instance
                resolve(new Service(worker));
                worker.off('error', reject);
            });
        });
    }) as Promise<Service<Definitions>>;

    pool.enqueue(item);

    return promise;
};
