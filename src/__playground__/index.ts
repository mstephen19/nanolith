import api from './worker.js';
import { SharedMap } from '@nanolith';

const map = new SharedMap({ count: 0 });

const promise = api({ name: 'handler', params: [map.transfer] });
const promise2 = api({ name: 'handler', params: [map.transfer] });
const promise3 = api({ name: 'handler', params: [map.transfer] });
const promise4 = api({ name: 'handler', params: [map.transfer] });

for (let i = 1; i <= 1000; i++) {
    await map.set('count', (prev) => +prev + 1);
}

await Promise.all([promise, promise2, promise3, promise4]);

console.log(await map.get('count'));

map.close();
