import { ServiceCluster } from '../index.js';
import { api } from './worker.js';

const cluster = new ServiceCluster(api);

await cluster.launch(3, {
    exceptionHandler: (error) => {
        console.error(error);
    },
});
