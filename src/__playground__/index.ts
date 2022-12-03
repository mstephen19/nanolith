import { api2 } from './worker.js';

const data = await api2({ name: 'something' });

console.log(data);
