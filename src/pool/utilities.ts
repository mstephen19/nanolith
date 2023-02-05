import { cpus } from 'os';
import { concurrencyOptionMultipliers } from '@constants/pool.js';

import { ConcurrencyOption } from '@constants/pool.js';
import type { PoolItemOptions, PoolItemConfig } from '@typing/pool.js';

export const cleanPoolConfig = <Options extends PoolItemConfig>({
    file,
    workerData,
    priority = false,
    options = {},
    reffed = true,
    messengers = [],
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
    };
};

export const generateConcurrencyValue = <Option extends ConcurrencyOption>(option: Option) => {
    // if (!Object.values(ConcurrencyOption).includes(option)) throw new Error(`${option} isn't a proper ConcurrencyOption!`);
    return Math.round(cpus().length * concurrencyOptionMultipliers[option]);
};

export const getDefaultPoolConcurrency = () => generateConcurrencyValue(ConcurrencyOption.Default);
