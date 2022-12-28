// 💡 index.ts
import { SharedMap } from 'nanolith';
import { worker } from './worker.js';

// Initialize a new SharedMap that has a key of "foo"
const countMap = new SharedMap({ count: 0 });

// Run 5 task functions in true parallel which will each increment
// the count by one thousand.
await Promise.all([
    worker({ name: 'handleMap', params: [countMap.transfer] }),
    worker({ name: 'handleMap', params: [countMap.transfer] }),
    worker({ name: 'handleMap', params: [countMap.transfer] }),
    worker({ name: 'handleMap', params: [countMap.transfer] }),
    worker({ name: 'handleMap', params: [countMap.transfer] }),
]);

// This can be expected to be "1000"
console.log(await countMap.get('count'));

// Close the mutex orchestrator (only necessary on the
// thread where the SharedMap was first instantiated).
countMap.close();
