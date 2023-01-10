import { ServiceCluster } from 'nanolith';
import { api } from './worker.js';

const cluster = new ServiceCluster(api);

const x = await cluster.launch(1);

console.log(x);

await cluster.closeAll();
