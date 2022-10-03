import { define, parent } from '../index.js';

export const api = await define({
    sendMessageToMain: () => {
        parent.sendMessage('Hey from worker!');
    },
    registerListener: () => {
        parent.onMessage<string>((msg) => {
            console.log('Received from main:', msg);
            parent.sendMessage('ready to terminate!');
        });
    },
    throwErrorOnMessage: () => {
        parent.onMessage(() => {
            throw new Error('oops');
        });
    },
});
