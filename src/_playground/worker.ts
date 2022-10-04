import { threadId } from 'worker_threads';
import { define, messages, parent } from '../index.js';

export const api = await define({
    registerListener: async () => {
        const messenger = await messages.use('testing123');

        messenger.onMessage<string>((data) => {
            console.log(data, `received on thread: ${threadId}`);
        });
    },
    sendMessage: async () => {
        const messenger = await messages.use('testing123');

        messenger.sendMessage(`heyo from thread ${threadId}`);
    },
});
