import { Readable } from 'stream';
import { Messenger } from '../index.js';
import { api } from './worker.js';

const messenger = new Messenger('channel');

await api.launchService({
    messengers: [messenger],
});

await api.launchService({
    messengers: [messenger],
});

const arr = ['hello', 'world', 'foo', 'bar'];
const myStream = new Readable({
    read() {
        if (!arr.length) this.push(null);

        this.push(arr.splice(0, 1)[0]);
    },
});

myStream.pipe(await messenger.createStream({ name: 'foo' }));
