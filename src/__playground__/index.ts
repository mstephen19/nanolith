import { Readable } from 'stream';
import { api } from './worker.js';

const data = ['hello', 'world', 'foo', 'bar'];

const myStream = new (class MyStream extends Readable {
    _read() {
        if (!data.length) return this.push(null);

        this.push(data.splice(0, 1)[0]);
    }
})();

const service = await api.launchService();

myStream.pipe(await service.createStream({ name: 'foo' }));
