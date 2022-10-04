import { pool } from '../index.js';
import { api } from './worker.js';

setInterval(() => {
    console.log(pool.queueLength);
}, 2e3);

const map = [...Array(1000).keys()].map(() => api({ name: 'add', params: [1, 2] }));

await Promise.all(map);
