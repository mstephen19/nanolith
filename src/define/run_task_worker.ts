import { PoolItem, pool } from '../pool/index.js';
import { WorkerType } from '../types/workers.js';
import { WorkerMessageType } from '../types/messages.js';

import type { TaskWorkerOptions } from '../types/workers.js';
import type { WorkerBaseMessageBody, WorkerTaskReturnMessageBody, WorkerTaskErrorMessageBody } from '../types/messages.js';

export const runTaskWorker = <Options extends TaskWorkerOptions>(file: string, identifier: string, { name, params, ...rest }: Options) => {
    const item = new PoolItem({
        file,
        workerData: {
            type: WorkerType.Task,
            name,
            params: params ?? [],
            identifier,
        },
        ...rest,
    });

    const promise = new Promise((resolve, reject) => {
        item.on('created', (worker) => {
            worker.on('error', reject);
            worker.on('messageerror', reject);

            // Handles the receiving of the task's return value
            // and the receiving of caught errors
            worker.on('message', (body: WorkerBaseMessageBody) => {
                if (body.type === WorkerMessageType.TaskReturn) {
                    resolve((body as WorkerTaskReturnMessageBody).data);
                }

                if (body.type === WorkerMessageType.TaskError) {
                    reject((body as WorkerTaskErrorMessageBody).data);
                }
            });
        });
    });

    pool.enqueue(item);

    return promise;
};
