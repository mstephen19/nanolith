import { pool } from '../index.js';
import { api } from './worker.js';

const service = await api.launchService({
    exceptionHandler: async ({ terminate }) => {
        await terminate();
    },
});

await service.call({ name: 'throwOnMessage' });

console.log('will throw');
service.sendMessage('foo');

await new Promise((resolve) => setTimeout(resolve, 5e3));

console.log(service.closed);

const data = await service.call({ name: 'add', params: [5, 6] });
console.log(data);
