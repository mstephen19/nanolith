import { ConcurrencyOption } from '../types/pool.js';

export const concurrencyOptionMultipliers: Record<ConcurrencyOption, number> = {
    [ConcurrencyOption.Quarter]: 0.25,
    [ConcurrencyOption.Half]: 0.5,
    [ConcurrencyOption.Default]: 1,
    [ConcurrencyOption.x1]: 1,
    [ConcurrencyOption.x2]: 2,
    [ConcurrencyOption.x4]: 4,
    [ConcurrencyOption.x6]: 6,
    [ConcurrencyOption.x8]: 8,
    [ConcurrencyOption.x10]: 10,
};
