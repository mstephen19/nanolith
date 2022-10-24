import { define, messages } from '../index.js';

export const api = await define({
    async sendSomething() {
        // We now have access to the Messenger object we
        // created and attached to the worker through this
        // variable.
        const messenger = await messages.use('foo-bar');

        // View all messengers currently attached to the
        // worker
        console.log(messages.seek());
    },
});
