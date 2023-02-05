import { Readable } from 'stream';
import { worker } from './worker.js';

const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const readStream = Readable.from(data);

const service = await worker.launchService();

readStream.pipe(await service.createStream());

service.onMessage<string>(async (data) => {
    if (data !== 'ready_to_close') return;
    await service.close();
});
