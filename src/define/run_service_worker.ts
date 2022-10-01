import { PoolItem, pool } from '../pool/index.js';
import { WorkerType } from '../types/workers.js';
import { Service } from '../service/index.js';

import type { ServiceWorkerOptions } from '../types/workers.js';
import type { TaskDefinitions } from '../types/definitions.js';

export const runServiceWorker = async <Definitions extends TaskDefinitions, Options extends ServiceWorkerOptions>(
    file: string,
    identifier: string,
    options: Options
) => {
    const item = new PoolItem({
        file,
        workerData: {
            type: WorkerType.Service,
            identifier,
        },
        ...options,
    });

    const promise = new Promise((resolve, reject) => {
        item.on('created', (worker) => {
            worker.on('online', () => resolve(new Service(worker)));
            worker.on('error', reject);
        });
    }) as Promise<Service<Definitions>>;

    pool.enqueue(item);

    return promise;
};
