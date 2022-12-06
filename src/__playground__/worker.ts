import { threadId } from 'worker_threads';
import { define, messengers } from '../index.js';

export const api = await define({
    async __initializeService() {
        const messenger = await messengers.use('channel');
        messenger.onMessage((data) => {
            console.log(data);
        });

        messenger.onStream(({ metaData, accept }) => {
            console.log(metaData);
            if (threadId === 1) return console.log('declining');
            console.log('accepting');

            const stream = accept();

            stream.on('data', (data) => {
                console.log(data);
            });
        });
    },
});
