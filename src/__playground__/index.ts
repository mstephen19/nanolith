// import { ServiceCluster } from '../index.js';
import { api } from './worker.js';

const service = await api.launchService();

await new Promise((r) => setTimeout(r, 2e3));

await service.close();
