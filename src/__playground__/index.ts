import { ServiceCluster } from '../index.js';
import { api } from './worker.js';

const cluster = new ServiceCluster(api);

const x = await cluster.launch(1);
