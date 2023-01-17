import type { Awaitable } from './utilities.js';

export type Mutex = Int32Array;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SharedMapRawData<Data = Record<string, any>> = {
    __keys: Uint8Array;
    __values: Uint8Array;
    __identifier: string;
    __mutex: Mutex;
};

export interface SharedMapWatch {
    /**
     * A boolean defining whether or not the value has changed
     * since the last time it was accessed via `.current`
     */
    changed(): boolean;
    /**
     * A getter function for the current value.
     */
    current(): string | null;
    /**
     * A function that, when called, will stop the watch process.
     * After calling `stopWatching()`, no further changes to the
     * value will be reflected in the `changed` or `current` getters.
     */
    stopWatching(): void;
}

export type KeyData = {
    name: string;
    start: number;
    end: number;
};

export type SetWithPreviousHandler<Data> = (previousValue: string) => Awaitable<Data>;

export type Key = `${string}(${number},${number});`;

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
     *
     * If the size of the initial keys is zero, the default
     * size of **1kb** is used for the keys buffer.
     */
    multiplier?: number;
    /**
     * When `bytes` is provided, the `multiplier` is not used when
     * creating the values array and the fixed byte size provided is
     * used instead.
     *
     * If this option is not provided and the size of the initial values
     * is zero, the default size of **3kb** is used for the values buffer.
     */
    bytes?: number;
};
