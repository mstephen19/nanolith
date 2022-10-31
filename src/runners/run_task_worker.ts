import { PoolItem, pool } from '../pool/index.js';
import { WorkerType } from '../types/workers.js';
import { WorkerMessageType } from '../types/messages.js';

import type { TaskWorkerOptions } from '../types/workers.js';
import type {
    WorkerBaseMessageBody,
    WorkerTaskReturnMessageBody,
    WorkerTaskErrorMessageBody,
    WorkerExceptionMessageBody,
} from '../types/messages.js';
// import { getCurrentFile } from '../define/utilities.js';

export const runTaskWorker = <Options extends TaskWorkerOptions>(file: string, identifier: string, { name, params, ...rest }: Options) => {
    // if (getCurrentFile(3) === file) throw new Error('Cannot call tasks from the same file from which they were defined!');
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
        item.once('created', (worker) => {
            worker.on('error', reject);
            worker.on('messageerror', reject);

            const earlyExitHandler = () => {
                reject(new Error('Worker exited early!'));
            };

            worker.on('exit', earlyExitHandler);

            // Handles the receiving of the task's return value
            // and the receiving of caught errors
            worker.on('message', async (body: WorkerBaseMessageBody) => {
                if (body.type === WorkerMessageType.WorkerException) {
                    worker.off('exit', earlyExitHandler);
                    await worker.terminate();
                    reject((body as WorkerExceptionMessageBody).data);
                }

                if (body.type === WorkerMessageType.TaskReturn) {
                    worker.off('exit', earlyExitHandler);
                    resolve((body as WorkerTaskReturnMessageBody).data);
                }

                if (body.type === WorkerMessageType.TaskError) {
                    worker.off('exit', earlyExitHandler);
                    reject((body as WorkerTaskErrorMessageBody).data);
                }
            });
        });
    });

    pool.enqueue(item);

    return promise;
};
