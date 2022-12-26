// 💡 index.ts
import { ServiceCluster } from '@service_cluster';
// Importing the Nanolith API we created in worker.ts
import { worker } from './worker.js';

const cluster = new ServiceCluster(worker);

const data = await cluster.launch(1);
