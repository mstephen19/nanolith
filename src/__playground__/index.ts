import { api } from './worker.js';

const service = await api.launchService();

service.onStream((stream) => {
    // Only handle streams where an object with a name
    // of "foo" has been attached to it.
    if (stream.metaData.name !== 'foo') return;

    stream.on('data', (data) => {
        console.log('received on main thread', data);
    });
});

await service.call({ name: 'sendStream' });
