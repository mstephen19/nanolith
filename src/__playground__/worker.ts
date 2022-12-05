import { define, parent, messengers } from '../index.js';

export const api = await define({
    async __initializeService() {
        console.log(await messengers.use('channel'));
    },
});
