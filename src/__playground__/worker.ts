import { define, parent } from '../index.js';

export const api = await define({
    __initializeService() {
        parent.onStream((stream) => {
            // Only handle streams where an object with a name
            // of "foo" has been attached to it.
            if (stream.metaData.name !== 'foo') return;

            stream.on('data', (data) => {
                console.log('received', data);
            });
        });
    },
});
