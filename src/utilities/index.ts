import { isMainThread } from 'worker_threads';

/**
 * Throws an error if the current thread is the main thread.
 */
export const assertIsNotMainThread = (feature: string) => {
    if (isMainThread) throw new Error(`${feature} cannot be used on the main thread!`);
};
