import { define, parent } from '../index.js';

export const messenger = await define({
    sendMessageToMain: () => {
        parent.sendMessage('Hey from worker!');
    },
    registerListener: () => {
        parent.onMessage<string>((msg) => {
            console.log('Received from main:', msg);
            parent.sendMessage('ready to terminate!');
        });
    },
});
