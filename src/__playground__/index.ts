import { Readable } from 'stream';
import { Messenger } from '../index.js';
import { api } from './worker.js';

const messenger = new Messenger('channel');

// Launch two services
await api.launchService({
    messengers: [messenger],
});

await api.launchService({
    messengers: [messenger],
});

// At this point, there are three Messenger instances
// connected to our channel named "channel"

// Create a basic stream
const arr = ['hello', 'world', 'foo', 'bar'];
const myStream = new Readable({
    read() {
        if (!arr.length) this.push(null);

        this.push(arr.splice(0, 1)[0]);
    },
});

// Send the stream over the channel
myStream.pipe(await messenger.createStream({ name: 'foo' }));
