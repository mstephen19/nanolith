import { Messenger } from '../index.js';
import { api } from './worker.js';

const service = await api.launchService();

// Creating the messenger after launching the service
const messenger = new Messenger('hello');

// The promise resolves once the service worker has
// notified the Messenger instance that it has
// successfully received the messenger.
await service.sendMessenger(messenger);

messenger.sendMessage('hello from main thread!');

await service.close();
