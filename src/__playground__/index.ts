import { pool } from 'nanolith';
import { worker } from './worker.js';

const cluster = await worker.clusterize(pool.maxConcurrency, {
    autoRenew: true,
});
