import { Readable } from 'stream';
import { worker } from './worker.js';

const data = ['foo', 'bar', 'baz'];

const readable = new Readable({
    read() {
        this.push(data.shift() ?? null);
    },
});

const service = await worker.launchService();

readable.pipe(await service.createStream({ foo: 'bar' }));
