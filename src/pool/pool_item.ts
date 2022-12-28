import { TypedEmitter } from 'tiny-typed-emitter';
import { cleanPoolConfig } from './utilities.js';

import type { PoolItemConfig, PoolItemOptions, PoolItemEvents } from '@typing/pool.js';
import type { WorkerType } from '@constants/workers.js';

export class PoolItem<Type extends WorkerType = WorkerType> extends TypedEmitter<PoolItemEvents> {
    public readonly options: PoolItemOptions;

    constructor(config: PoolItemConfig<Type>) {
        super();
        this.options = cleanPoolConfig(config);
    }
}
