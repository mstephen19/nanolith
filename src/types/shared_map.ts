// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SharedMapTransferData<Data = Record<string, any>> = {
    __keys: Uint8Array;
    __values: Uint8Array;
    __status: Uint8Array;
};

export type KeyData = {
    name: string;
    start: number;
    end: number;
};

export type Key = `${string}(${number},${number});`;

export const enum BusyStatus {
    Free = 0,
    Busy = 1,
}

export enum Bytes {
    /**
     * **1b** - One byte.
     */
    byte = 1,
    /**
     * **1kb** - One kilobyte.
     */
    kilobyte = 1024,
    /**
     * **1mb** - One megabyte.
     */
    megabyte = 1048576,
}

export type SharedMapOptions = {
    /**
     * Used by `SharedMap` for two things:
     *
     * 1. The size of the keys buffer is determined by taking
     * the byte length of the initial keys and multiplying it
     * by this number.
     *
     * 2. If the `bytes` option is not provided, the size of the
     * values buffer is calculated in the same way.
     *
     * Defaults to `10` when no value is provided.
     */
    multiplier?: number;
    /**
     * When `bytes` is provided, the `multiplier` is not used when
     * creating the values array and the fixed byte size provided is
     * used instead.
     */
    bytes?: number;
};
