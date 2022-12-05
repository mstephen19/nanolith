import { Messenger } from '../index.js';
import { api } from './worker.js';

const service = await api.launchService();

const messenger = new Messenger('foo');

await service.sendMessenger(messenger);
