import { PoolItem, pool } from '@pool';
import { WorkerType } from '@constants/workers.js';
import { WorkerMessageType } from '@constants/messages.js';

import type { TaskWorkerOptions } from '@typing/workers.js';
import type {
    WorkerBaseMessageBody,
    WorkerTaskReturnMessageBody,
    WorkerTaskErrorMessageBody,
    WorkerExceptionMessageBody,
} from '@typing/messages.js';

export const runTaskWorker = <Options extends TaskWorkerOptions>(file: string, identifier: string, { name, params, ...rest }: Options) => {
    if (!name) throw new Error('No task name provided!');

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

            const earlyExitHandler = (code: number) => {
                if (code !== 0) return reject(new Error(`Worker exited early with code ${code}!`));
                resolve(undefined);
            };

            worker.once('exit', earlyExitHandler);

            // Handles the receiving of the task's return value
            // and the receiving of caught errors
            worker.on('message', async (body: WorkerBaseMessageBody) => {
                switch (body.type) {
                    case WorkerMessageType.WorkerException: {
                        worker.off('exit', earlyExitHandler);
                        await worker.terminate();
                        reject((body as WorkerExceptionMessageBody).data);
                        break;
                    }
                    case WorkerMessageType.TaskReturn: {
                        worker.off('exit', earlyExitHandler);
                        resolve((body as WorkerTaskReturnMessageBody).data);
                        break;
                    }
                    case WorkerMessageType.TaskError: {
                        worker.off('exit', earlyExitHandler);
                        reject((body as WorkerTaskErrorMessageBody).data);
                        break;
                    }
                    default:
                        return;
                }
            });
        });
    });

    pool.__enqueue(item);

    return promise;
};
