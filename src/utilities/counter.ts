import { createSharedUint32, getValue, setValue } from './shared_uint32.js';
import type { SharedUint32 } from './shared_uint32.js';

export type Counter = SharedUint32;

export const createCounter = (): Counter => {
    return createSharedUint32();
};

export const getCount = (counter: Counter) => {
    return getValue(counter);
};

export const incr = (counter: Counter) => {
    setValue(counter, (num) => num + 1);
};

export const decr = (counter: Counter) => {
    setValue(counter, (num) => num - 1);
};
