import { define, parent, messengers } from '../index.js';

export const api = await define({
    async __initializeService() {
        const messenger = await messengers.use('channel');

        messenger.onMessage((data) => {
            console.log(data);
        });

        messenger.onStream((stream) => {
            stream.on('data', (data) => {
                console.log(data);
            });
        });
    },
});
