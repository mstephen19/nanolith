import { createMutex, lockMutexSync, unlockMutex } from './mutex.js';

import type { Mutex } from './mutex.js';

type Value = Uint32Array;

export type SharedUint32 = {
    value: Value;
    lock: Mutex;
};

export const create = (): SharedUint32 => {
    return {
        lock: createMutex(),
        value: new Uint32Array(new SharedArrayBuffer(4)),
    };
};

export const getValue = (data: SharedUint32) => {
    // waitForWriters(data.lock);
    return data.value[0];
};

export const setValue = (data: SharedUint32, callback: (int: number) => number) => {
    lockMutexSync(data.lock);
    data.value[0] = callback(getValue(data));
    unlockMutex(data.lock);
};
