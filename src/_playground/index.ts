import { messenger } from './worker.js';

const service = await messenger.launchService();

service.onMessage<string>((msg) => {
    if (msg === 'ready to terminate!') return service.terminate();
    console.log('Received from worker:', msg);
});

await service.call({
    name: 'sendMessageToMain',
});

await service.call({
    name: 'registerListener',
});

service.sendMessage('Hey from main!');
