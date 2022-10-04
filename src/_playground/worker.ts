import { threadId } from 'worker_threads';
import { define, messages, parent } from '../index.js';

export const api = await define({
    doShit: async () => {
        const messenger = await messages.use('testing123');

        console.log(messenger);

        messenger.onMessage(() => {
            console.log('received');
            throw new Error('shite');
        });

        await new Promise((resolve) => setTimeout(resolve, 2e4));
    },
});
