import { define, parent, messengers } from '../index.js';

export const api = await define({
    __initializeService() {
        parent.onMessengerReceived((messenger) => {
            console.log(messenger);
        });
    },
});
