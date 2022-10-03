import { define, parent } from '../index.js';

export const api = await define({
    registerMessengerListener: () => {
        parent.onMessengerReceived((messenger) => {
            messenger.sendMessage('hey from worker!');
            messenger.onMessage<string>((data) => console.log(data, 'in worker'));
        });
    },
});
