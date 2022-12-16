import { SharedMap } from '../index.js';
import { api } from './worker.js';

const map = new SharedMap({ foo: 'xyz', fizz: 'y', buzz: 'z' });

await api({ name: 'handleSharedMap', params: [map.transfer], reffed: true });

console.log(await map.get('buzz'));
