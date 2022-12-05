import { define, parent, messengers } from '../index.js';

export const api = await define({
    __initializeService() {
        setTimeout(() => {
            parent.sendMessage('foo');
        }, 10e3);
    },
});
