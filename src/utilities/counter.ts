import type { Mutex } from '@typing/shared_map.js';
import { createMutex, lockMutexSync, unlockMutex } from './mutex.js';

type Count = Uint32Array;

export type Counter = {
    lock: Mutex;
    count: Count;
};

const createCount = (): Count => new Uint32Array(new SharedArrayBuffer(4));

export const createCounter = (): Counter => {
    return {
        lock: createMutex(),
        count: createCount(),
    };
};

export const getCount = (counter: Counter) => {
    return counter.count[0];
};

export const incr = (counter: Counter) => {
    lockMutexSync(counter.lock);
    counter.count[0] = getCount(counter) + 1;
    unlockMutex(counter.lock);
};

export const decr = (counter: Counter) => {
    lockMutexSync(counter.lock);
    counter.count[0] = getCount(counter) - 1;
    unlockMutex(counter.lock);
};
