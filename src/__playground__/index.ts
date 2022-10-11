import { ServiceCluster } from '../index.js';
import { api } from './worker.js';

const cluster = new ServiceCluster(api);

await cluster.addService({ reffed: true });
await cluster.addService({ reffed: true });

const p1 = cluster.use().call({
    name: 'add',
    params: [1, 2],
});

const p2 = cluster.use().call({
    name: 'add',
    params: [1, 2],
});

const p3 = cluster.use().call({
    name: 'add',
    params: [1, 2],
});

const p4 = cluster.use().call({
    name: 'add',
    params: [1, 2],
});

const p5 = cluster.use().call({
    name: 'add',
    params: [1, 2],
});

console.log(cluster.activeServices);
console.log(cluster.activeServiceCalls);

await Promise.all([p1, p2, p3, p4, p5]);

await cluster.closeAll();
