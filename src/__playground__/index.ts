import { Messenger } from '@messenger';
import { worker } from './worker.js';

const receiver = new Messenger('receiver');

const p = receiver.waitForMessage<string>((msg) => {
    return msg === 'before';
});

await worker({ name: 'foo', messengers: [receiver] });
await p;
