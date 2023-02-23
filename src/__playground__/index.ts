import { worker } from './worker.js';

const service = await worker.launchService();

await service.call({ name: 'exit1' });
