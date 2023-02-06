import { worker } from './worker.js';

const cluster = await worker.clusterize(5, {
    exceptionHandler({ error, terminate }) {
        console.log(error);
    },
    cluster: {
        autoRenew: true,
    },
});

cluster.use().close();
