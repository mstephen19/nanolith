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
