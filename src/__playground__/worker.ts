import { Readable } from 'stream';
import { createWriteStream } from 'fs';
import { define, parent } from '../index.js';

export const api = await define({
    __initializeService() {
        parent.onMessage<{ type: 'init_stream'; id: string }>(({ type, id }) => {
            if (type !== 'init_stream') return;

            const stream = new Readable({
                read() {},
            });

            parent.onMessage<{ type: `stream_data-${string}`; data: Buffer; done: boolean }>(({ type, data, done }) => {
                if (type !== `stream_data-${id}`) return;

                stream.push(data);
                if (done) return void stream.push(null);
            });

            const writable = createWriteStream('./data.txt');

            stream.pipe(writable);
        });
    },
});
