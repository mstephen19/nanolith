import { Readable } from 'stream';
import { define, parent } from '../index.js';

export const api = await define({
    async sendStream() {
        const data = ['hello', 'world', 'foo', 'bar'];

        const myStream = new Readable({
            read() {
                if (!data.length) return this.push(null);

                this.push(data.splice(0, 1)[0]);
            },
        });

        myStream.pipe(await parent.createStream({ name: 'foo' }));
    },
});
