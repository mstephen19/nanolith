import { Messenger } from '../index.js';
import { api } from './worker.js';

const messenger = new Messenger('test');

const service = await api.launchService();

messenger.onMessage<string>((data) => console.log(data, 'in main thread'));

await service.call({
    name: 'registerMessengerListener',
});

await service.sendMessenger(messenger);

messenger.sendMessage('hey from main thread!');
