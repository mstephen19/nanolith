// import { ServiceCluster } from '../index.js';
import { api } from './worker.js';

const service = await api.launchService();

await service.close();
