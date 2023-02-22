import { worker } from './worker.js';

const data = await worker({ name: 'foo' });

console.log(data);
