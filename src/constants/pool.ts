export enum ConcurrencyOption {
    /**
     * One thread per four cores.
     */
    Quarter = 'Quarter',
    /**
     * One thread per two cores.
     */
    Half = 'Half',
    /**
     * Default concurrency. One thread per core (`x1`).
     */
    Default = 'x1',
    /**
     * One thread per core.
     */
    x1 = 'x1',
    /**
     * Two threads per core.
     */
    x2 = 'x2',
    /**
     * Four threads per core.
     */
    x4 = 'x4',
    /**
     * Six threads per core.
     */
    x6 = 'x6',
    /**
     * Eight threads per core.
     */
    x8 = 'x8',
    /**
     * Ten threads per core.
     */
    x10 = 'x10',
}

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
