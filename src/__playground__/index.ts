import { pool } from 'nanolith';
import { worker } from './worker.js';

// Spawn multiple concurrent threads
const cluster = await worker.clusterize(pool.maxConcurrency, {
    autoRenew: true,
});

// Run your tasks on separate threads
cluster.use().call({ name: 'yourTask' });
