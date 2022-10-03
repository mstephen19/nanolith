import { Messenger } from '../index.js';
import { api } from './worker.js';

const messenger = new Messenger();

const service = await api.launchService();

messenger.onMessage<string>((data) => console.log(data, 'in main thread'));

await service.call({
    name: 'registerMessengerListener',
});

service.sendMessenger(messenger);

messenger.sendMessage('hey from main thread!');
