import { Messenger } from '../index.js';
import { api } from './worker.js';

// Launch two services that both have access to the same set
// of function definitions.
const service = await api.launchService();
const service2 = await api.launchService();

// Create a messenger. Wraps BroadcastChannel
const messenger = new Messenger('testing123');

// Run a function in each service that registers a listener on the
// Messenger
await Promise.all([
    service.call({ name: 'registerListener' }),
    service2.call({ name: 'registerListener' }),
    service.sendMessenger(messenger),
    service2.sendMessenger(messenger),
]);

// Send a message to each other
await Promise.all([service.call({ name: 'sendMessage' }), service2.call({ name: 'sendMessage' })]);
