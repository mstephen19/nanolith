import { worker } from './worker.js';

const service = await worker.launchService();

await service.call({ name: 'exit1' });

setImmediate(() => console.log(service.closed));

// const cluster = await worker.clusterize(5, {
//     cluster: {
//         autoRenew: false,
//     },
// });

// console.log('calling');
// const data = await cluster.use().call({ name: 'exit1' });
// console.log(data, 'done');

// console.log('foo');
// console.log(cluster.activeServices);
