import { Worker, SHARE_ENV } from 'worker_threads';
import { generateConcurrencyValue, getConcurrencyCounter, getActiveCounter } from './utilities.js';
import { ConcurrencyOption } from '@constants/pool.js';
import { PoolItem } from './pool_item.js';
import { SharedCounter, SharedU32Integer } from '@utilities';

/**
 * This is the big boy that manages all Nanolith workers 💪
 */
class Pool {
    #concurrency = getConcurrencyCounter();
    #active = getActiveCounter();
    #queue: PoolItem[] = [];
    /**
     * Easy access to the {@link ConcurrencyOption} enum right on `pool`.
     */
    readonly option = ConcurrencyOption;

    /**
     * The maximum concurrency of the {@link Pool}, which defaults to one thread per core
     * on the machine being used. Can be changed with the `pool.setConcurrency` function
     */
    get maxConcurrency() {
        return SharedU32Integer.getValue(this.#concurrency);
    }

    /**
     * Whether or not the pool has currently reached its max concurrency.
     */
    get maxed() {
        return SharedCounter.getCount(this.#active) >= SharedU32Integer.getValue(this.#concurrency);
    }

    /**
     * The current number of item in the pool's queue on the current thread.
     */
    get queueLength() {
        return this.#queue.length;
    }

    /**
     * The current number of workers that are running under the pool.
     */
    get activeCount() {
        return SharedCounter.getCount(this.#active);
    }

    /**
     * A `boolean` indicating whether or not the pool is currently doing nothing.
     */
    get idle() {
        return !SharedCounter.getCount(this.#active);
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
     * Modify the `maxConcurrency` of the pool. Use this wisely.
     * The {@link ConcurrencyOption} value defines how many workers `Pool` will allow to
     * run at the same time. It defaults to one worker per core on
     * the machine running the process.
     */
    setConcurrency<Option extends ConcurrencyOption>(option: Option) {
        if (!Object.values(ConcurrencyOption).includes(option)) throw new Error(`${option} is not a valid and safe ConcurrencyOption!`);

        SharedU32Integer.setValue(this.#concurrency, () => generateConcurrencyValue(option));
    }

    /**
     * 💥 **HEY!** 💥
     *
     * Don't use this unless you really know what you're doing.
     * This method is used internally to queue tasks and services up to the pool
     * to be created and run.
     */
    __enqueue(item: PoolItem) {
        // Prevent workers from being run on any other thread than the main thread.
        // if (!isMainThread) throw new Error("Can't enqueue items to the pool on any other thread than the main thread!");
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
        if (this.maxed || !this.#queue.length) return;

        SharedCounter.incr(this.#active);

        const item = this.#queue.shift()!;
        const { file, workerData, options, reffed, shareEnv } = item.options;

        const worker = new Worker(file, {
            ...options,
            workerData: {
                ...workerData,
                pool: {
                    active: this.#active,
                    concurrency: this.#concurrency,
                },
            },
            env: shareEnv ? SHARE_ENV : undefined,
        });

        // If the worker should be reffed according to the config options,
        // go ahead and ref it.
        if (reffed) worker.ref();
        // Otherwise, fall back to a default of unreffed.
        else worker.unref();

        item.emit('created', worker);

        worker.once('exit', () => {
            SharedCounter.decr(this.#active);
            this.#next();
        });
    }
}

/**
 * The single cross-thread global instance of {@link Pool} that manages all Nanolith workers 💪
 */
export const pool = Object.seal(new Pool());
