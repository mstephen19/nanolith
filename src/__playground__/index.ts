import { api } from './worker.js';
import { cpus } from 'os';
import { pool, ConcurrencyOption } from '../index.js';

const service = await api.launchService();
// Registers a listener that sends a message back to the parent when
// a message is received in the worker. Allows for simple testing of
// back and forth communication.
await service.call({ name: 'registerListenerOnParent' });

service.onMessage<string>((data) => {
    console.log('received back on main thread', data);
});

service.sendMessage('foo');
