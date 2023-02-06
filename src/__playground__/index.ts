import { worker } from './worker.js';

const service = await worker.launchService();

try {
    await service.call({ name: 'exit1' });
} catch (error) {}

await new Promise((resolve) =>
    setImmediate(async () => {
        console.log(service.closed);
        setTimeout(resolve, 2e3);
    })
);

await service.call({ name: 'exit1' });

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
