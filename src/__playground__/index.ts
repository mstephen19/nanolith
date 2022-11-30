import { ServiceCluster } from '../index.js';
import { api } from './worker.js';

const cluster = new ServiceCluster(api);

await cluster.launch(3, {
    exceptionHandler: (error) => {
        console.error(error);
    },
});

const data = await cluster.use().call({
    name: 'add5',
    params: [2],
});

console.log(data);

await cluster.closeAll();
