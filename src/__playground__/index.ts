// 💡 index.ts
// Importing the Nanolith API we created in worker.ts
import { worker } from './worker.js';

// Launch 6 services at the same time.
const cluster = await worker.clusterize(6);

// Use the least busy service on the cluster.
// This is the service that is currently running
// the least amount of task calls.
const service = cluster.use();

// Call the task on the service as you normally would.
const result = await service.call({
    name: 'subtract',
    params: [10, 5],
});

console.log(result);

// Close all services on the cluster.
await cluster.closeAll();
