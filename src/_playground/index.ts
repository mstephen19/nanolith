import { Messenger } from '../index.js';
import { api } from './worker.js';

const messenger = new Messenger('testing123');

const service = await api.launchService({});

service.call({
    name: 'test',
});

await new Promise((r) => setTimeout(r, 7000));

await service.sendMessenger(messenger);

// service.close();
