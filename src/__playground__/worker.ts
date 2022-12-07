import { threadId } from 'worker_threads';
import { define, messengers } from '../index.js';

export const api = await define({
    async __initializeService() {
        const messenger = await messengers.use('channel');

        // In the .onStream callback, rather than having access to the stream
        // right away, it is only created after we call the "accept()" function.
        // The metadata sent along with the stream is also available in the
        // callback function.
        messenger.onStream(({ metaData, accept }) => {
            // Ignore the stream if the thread ID is 1
            if (threadId === 1) return;

            // Otherwise, accept it and start receiving the data
            const stream = accept();

            stream.on('data', (data) => {
                console.log(data);
            });
        });
    },
});
