import type { Awaitable } from './utilities.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SharedMapRawData<Data = Record<string, any>> = {
    __keys: Uint8Array;
    __values: Uint8Array;
    __identifier: string;
};

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

export type EventMap = Record<string, (...args: any[]) => Awaitable<void>>;

export type BroadcastChannelEmitterPostMessageBody<Events extends EventMap = EventMap, Key extends keyof Events = string> = {
    name: Key;
    value: Parameters<Events[Key]>;
};

export type SharedMapBroadcastChannelEvents = {
    push_to_queue: (id: string) => void;
    remove_from_queue: (id: string) => void;
    [key: `value_changed_${string}`]: (newEncodedValue: Uint8Array) => void;
    [key: `ready_${string}`]: () => void;
};
