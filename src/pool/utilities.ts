import { concurrencyOptionMultipliers } from './constants.js';
import { cpus } from 'os';
import { ConcurrencyOption } from '../types/pool.js';

import type { PoolItemOptions, PoolItemConfig } from '../types/pool.js';

export const cleanPoolConfig = <Options extends PoolItemConfig>({
    file,
    workerData,
    priority = false,
    options = {},
    reffed = true,
}: Options): PoolItemOptions => {
    if (!file) throw new Error('Filename not provided.');

    return {
        file,
        workerData,
        priority,
        options,
        reffed,
    };
};

export const generateConcurrencyValue = <Option extends ConcurrencyOption>(option: Option) => {
    if (!Object.values(ConcurrencyOption).includes(option)) throw new Error(`${option} isn't a proper ConcurrencyOption!`);

    return Math.round(cpus().length * concurrencyOptionMultipliers[option]);
};
