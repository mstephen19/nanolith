import { worker } from './worker.js';

const service = await worker.launchService();

try {
    await service.call({ name: 'exit' });
} catch (err) {
    console.log('caught', err);
}

try {
    await service.call({ name: 'exit' });
} catch (err) {
    console.log('caught', err);
}

console.log(service.activeCalls);
