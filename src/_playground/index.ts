import { Messenger, pool } from '../index.js';
import { api } from './worker.js';

await (async () => {
    try {
        // Create a messenger. Wraps BroadcastChannel
        const messenger = new Messenger('testing123');

        const promise = api({
            name: 'doShit',
            messengers: [messenger],
        });

        await new Promise((r) => setTimeout(r, 4e3));

        console.log('sending msgs');
        messenger.sendMessage('hi');
        messenger.sendMessage('hi');
        messenger.sendMessage('hi');
        messenger.sendMessage('hi');
        messenger.sendMessage('hi');
        messenger.sendMessage('hi');
        messenger.sendMessage('hi');
        messenger.sendMessage('hi');

        await promise;
    } catch (error) {
        console.log('caught');
    }
})();

console.log(pool.activeCount);
