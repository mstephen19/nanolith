import { cpus } from 'os';
import { concurrencyOptionMultipliers } from '@constants/pool.js';
import { ConcurrencyOption } from '@constants/pool.js';
import { isMainThread, workerData } from 'worker_threads';
import { SharedCounter, SharedU32Integer } from '@utilities';

import type { BaseWorkerData } from '@typing/worker_data.js';
import type { PoolItemOptions, PoolItemConfig } from '@typing/pool.js';

export const cleanPoolConfig = <Options extends PoolItemConfig>({
    file,
    workerData,
    priority = false,
    options = {},
    reffed = true,
    messengers = [],
    shareEnv = true,
}: Options): PoolItemOptions => {
    if (!file) throw new Error('Filename not provided.');

    return {
        file,
        workerData: {
            ...workerData,
            messengerTransfers: messengers.map((mess) => mess.raw),
            messengers: {},
        },
        priority,
        options,
        reffed,
        shareEnv,
    };
};

export const generateConcurrencyValue = <Option extends ConcurrencyOption>(option: Option) => {
    // if (!Object.values(ConcurrencyOption).includes(option)) throw new Error(`${option} isn't a proper ConcurrencyOption!`);
    return Math.round(cpus().length * concurrencyOptionMultipliers[option]);
};

export const getDefaultPoolConcurrency = () => generateConcurrencyValue(ConcurrencyOption.Default);

export const getActiveCounter = () => {
    // Create the initial instance of the counter on the
    // main thread
    if (isMainThread) return SharedCounter.create();

    // Any subsequent threads will use the counter data added
    // to the workerData
    const { pool } = workerData as BaseWorkerData;
    if (!pool || !pool.active) throw new Error('Pool corruption. Counter data not found.');
    return pool.active;
};

export const getConcurrencyCounter = () => {
    if (isMainThread) {
        const count = SharedU32Integer.create();
        SharedU32Integer.setValue(count, () => getDefaultPoolConcurrency());
        return count;
    }

    const { pool } = workerData as BaseWorkerData;
    if (!pool || !pool.concurrency) throw new Error('Pool corruption. Concurrency data not found.');
    return pool.concurrency;
};
