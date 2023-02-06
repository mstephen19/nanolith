import { worker } from './worker.js';

const cluster = await worker.clusterize(5, {
    cluster: {
        autoRenew: true,
    },
});

await cluster.use().close(1);

await new Promise((r) => setTimeout(r, 2e3));

console.log(cluster.activeServices);
