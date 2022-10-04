import { api } from './worker.js';
import { cpus } from 'os';
import { pool, ConcurrencyOption } from '../index.js';

const service = await api.launchService({
    exceptionHandler: () => {
        console.log('there was an exception');
    },
});

await service.call({ name: 'throwErrorOnMessage' });

service.sendMessage('hi');

console.log('running');

const data = await service.call({ name: 'test' });

service.close();
