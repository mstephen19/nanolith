// import { ServiceCluster } from '../index.js';
import { api } from './worker.js';

const service = await api.launchService();

const data = await service.call({
    name: 'add',
    params: [1, 2],
});

console.log(data);

await service.close();
