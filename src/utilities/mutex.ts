import { LockStatus } from '@constants/shared_map.js';

export type Mutex = Int32Array;

export const createMutex = (): Mutex => {
    // The underlying buffer must have at least 4 bytes
    const arr = new Int32Array(new SharedArrayBuffer(4));
    // Initialize with an unlocked status
    arr.set([LockStatus.Unlocked]);

    return arr;
};

export const lockMutexSync = (mutex: Mutex): void => {
    // If it's already unlocked, exchange that for a locked status and return out.
    if (Atomics.compareExchange(mutex, 0, LockStatus.Unlocked, LockStatus.Locked) === LockStatus.Unlocked) {
        return;
    }
    // Otherwise, wait for the status to be changed to something other than
    // locked.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Atomics.wait(mutex, 0, LockStatus.Locked, Infinity);
    lockMutexSync(mutex);
};

export const lockMutex = (mutex: Mutex): Promise<void> => {
    return new Promise((resolve) => {
        lockMutexSync(mutex);
        resolve();
    });
};

export const unlockMutex = (mutex: Mutex) => {
    if (Atomics.compareExchange(mutex, 0, LockStatus.Locked, LockStatus.Unlocked) !== LockStatus.Locked) {
        throw new Error('Mutex inconsistency.');
    }
    Atomics.notify(mutex, 0, 1);
};
