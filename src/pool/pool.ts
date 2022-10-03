import { cpus } from 'os';
import { Worker, SHARE_ENV, isMainThread } from 'worker_threads';
import { generateConcurrencyValue } from './utilities.js';
import { ConcurrencyOption } from '../types/pool.js';

import type { PoolItem } from './pool_item.js';

class Pool {
    private concurrency = cpus().length;
    private active = 0;
    private queue: PoolItem[] = [];
    readonly option = ConcurrencyOption;

    get maxed() {
        return this.active >= this.concurrency;
    }

    get queueLength() {
        return this.queue.length;
    }

    get activeCount() {
        return this.active;
    }

    get idle() {
        return !this.active;
    }

    /**
     * Modify the concurrency of the pool. Use this wisely.
     * This number defines how many workers `Pool` will allow to
     * run at the same time. It defaults to one worker per core on
     * the machine running the process.
     */
    setConcurrency<Option extends ConcurrencyOption>(option: Option) {
        this.concurrency = generateConcurrencyValue(option);
    }

    /**
     * Queue up configuration for a worker to be created and run.
     */
    enqueue(item: PoolItem) {
        // Prevent workers from being run on any other thread than the main thread.
        if (!isMainThread) throw new Error("Can't enqueue items to the pool on any other thread than the main thread!");

        if (item.options.priority) this.queue.unshift(item);
        else this.queue.push(item);

        if (!this.maxed) this.#next();
    }

    /**
     * Creates the next worker, if possible.
     */
    #next() {
        // If the concurrency is currency reached, or the queue
        // has a length of zero, do nothing.
        if (this.maxed || !this.queueLength) return;

        this.active++;

        const item = this.queue.shift()!;

        const { file, workerData, options, reffed } = item.options;

        const worker = new Worker(file, {
            ...options,
            workerData,
            env: SHARE_ENV,
        });

        if (reffed) worker.ref();
        else worker.unref();

        item.emit('created', worker);

        worker.on('exit', () => {
            this.active--;
            this.#next();
        });
    }
}

export const pool = new Pool();
