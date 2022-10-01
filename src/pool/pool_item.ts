import { TypedEmitter } from 'tiny-typed-emitter';
import { cleanPoolConfig } from './utilities.js';

import type { Worker } from 'worker_threads';
import type { PoolItemConfig, PoolItemOptions } from '../types/pool.js';
import type { WorkerType } from '../types/workers.js';

type PoolItemEvents = {
    created: (worker: Worker) => void;
};

export class PoolItem<Type extends WorkerType = WorkerType> extends TypedEmitter<PoolItemEvents> {
    public readonly options: PoolItemOptions;

    constructor(config: PoolItemConfig<Type>) {
        super();
        this.options = cleanPoolConfig(config);
    }
}
