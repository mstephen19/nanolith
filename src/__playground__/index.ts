import { api } from './worker.js';

const service = await api.launchService();

service.onStream((stream) => {
    console.log(stream.metaData);

    stream.on('data', (data) => {
        console.log(Buffer.from(data).toString('utf-8'));
    });
});

await service.call({ name: 'sendStream' });

// await service.close();
