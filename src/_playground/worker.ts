import { define, messages } from '../index.js';

export const api = await define({
    test: async () => {
        const messenger = await messages.use('testing123');

        console.log(messenger);
    },
});
