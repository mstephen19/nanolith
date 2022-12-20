import { SharedMap } from '../index.js';
// import { BroadcastChannel } from 'worker_threads';
import { api } from './worker.js';
// import { isSharedMapTransferData } from 'shared_map/utilities.js';

// const map = new SharedMap({ foo: 'bar' });

// console.log(await Promise.all([map.get('foo'), map.get('foo'), map.get('foo'), map.get('foo')]));

const map = new SharedMap({ count: 0 });

// Start the loop within a worker
const promise1 = api({
    name: 'handleSharedMap',
    params: [map.transfer],
    reffed: true,
});

// Start another loop in an identical worker
const promise2 = api({
    name: 'handleSharedMap',
    params: [map.transfer],
    reffed: true,
});

// Start the loop on the main thread. At this point,
// there are now three different threads modifying the
// same resource at the same time.
for (let i = 1; i <= 1_000; i++) {
    await map.set('count', +(await map.get('count'))! + 1);
}

// Wait for the workers to finish.
await Promise.all([promise1, promise2]);

// We can expect to see 300_000 here.
console.log(await map.get('count'));

// console.log(isSharedMapTransferData(map.transfer));
