import { worker } from './worker.js';

const service = await worker.launchService();

try {
    await service.call({ name: 'throw' });
} catch (error) {}

try {
    await service.call({ name: 'throw' });
} catch (error) {}

console.log(service.activeCalls);
