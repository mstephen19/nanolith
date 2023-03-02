import { Messenger } from 'nanolith';
import { worker } from './worker.js';

const foo = new Messenger('foo');

const service = await worker.launchService();

await service.sendMessenger(foo);

console.log('resolve');
