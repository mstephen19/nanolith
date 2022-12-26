// 💡 index.ts
import { ServiceCluster } from 'nanolith';
// Importing the Nanolith API we created in worker.ts
import { worker } from './worker.js';

const cluster = new ServiceCluster(worker);
