import { cpus } from 'os';
import { Worker, SHARE_ENV, isMainThread } from 'worker_threads';
import { generateConcurrencyValue } from './utilities.js';
import { ConcurrencyOption } from '../types/pool.js';
import { PoolItem } from './pool_item.js';

/**
 * This is the bad boy that manages all Nanolith workers 💪
 */
class Pool {
    #concurrency = cpus().length;
    #active = 0;
    #queue: PoolItem[] = [];
    /**
     * Easy access to the {@link ConcurrencyOption} `enum` right on `pool`.
     */
    readonly option = ConcurrencyOption;

    /**
     * The maximum concurrency of the {@link Pool}, which defaults to one thread per core
     * on the machine being used. Can be changed with the `pool.setConcurrency` function
     */
    get maxConcurrency() {
        return this.#concurrency;
    }

    /**
     * Whether or not the pool has reached its max concurrency.
     */
    get maxed() {
        return this.#active >= this.#concurrency;
    }

    /**
     * The current number of item in the pool's queue.
     */
    get queueLength() {
        return this.#queue.length;
    }

    /**
     * The current number of workers that are running under the pool.
     */
    get activeCount() {
        return this.#active;
    }

    /**
     * A `boolean` defining whether or not the pool is currently doing nothing.
     */
    get idle() {
        return !this.#active;
    }

    /**
     * Returns the internal `PoolItemOptions` for the next worker in the queue to be run.
     */
    get next() {
        return this.#queue[0].options;
    }

    /**
     * @param option A {@link ConcurrencyOption}
     *
     * Modify the concurrency of the pool. Use this wisely.
     * The {@link ConcurrencyOption} value defines how many workers `Pool` will allow to
     * run at the same time. It defaults to one worker per core on
     * the machine running the process.
     */
    setConcurrency<Option extends ConcurrencyOption>(option: Option) {
        if (!Object.values(ConcurrencyOption).includes(option)) throw new Error(`${option} is not a valid and safe ConcurrencyOption!`);

        this.#concurrency = generateConcurrencyValue(option);
    }

    /**
     * 💥 **HEY!** 💥
     *
     * Don't use this unless you really know what you're doing.
     * This method is used internally to queue tasks and services up to the pool
     * to be created and run.
     *
     * This function will throw an error when trying to spawn up workers from within
     * any thread that is not the main one.
     */
    enqueue(item: PoolItem) {
        // Prevent workers from being run on any other thread than the main thread.
        if (!isMainThread) throw new Error("Can't enqueue items to the pool on any other thread than the main thread!");

        if (!(item instanceof PoolItem)) throw new Error('The provided item cannot be enqueued.');

        if (item.options.priority) this.#queue.unshift(item);
        else this.#queue.push(item);

        if (!this.maxed) this.#next();
    }

    /**
     * Creates and runs the next worker, if possible.
     */
    #next() {
        // If the concurrency is currency reached, or the queue
        // has a length of zero, do nothing.
        if (this.maxed || !this.queueLength) return;

        this.#active++;

        const item = this.#queue.shift()!;

        const { file, workerData, options, reffed } = item.options;

        const worker = new Worker(file, {
            ...options,
            workerData,
            env: SHARE_ENV,
        });

        // If the worker should be reffed according to the config options,
        // go ahead and ref it.
        if (reffed) worker.ref();
        // Otherwise, fall back to a default of unreffed.
        else worker.unref();

        // ! Temporary
        worker.setMaxListeners(Infinity);
        // ! Temporary

        item.emit('created', worker);

        worker.once('exit', () => {
            this.#active--;
            this.#next();
        });
    }
}

/**
 * The single global instance of {@link Pool} that manages all Nanolith workers 💪
 */
export const pool = new Pool();
