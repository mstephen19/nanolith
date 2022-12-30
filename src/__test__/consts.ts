import { Readable } from 'stream';

const STREAM_DATA = ['hello', 'world', 'foo', 'bar'];

export const STREAM_DATA_RESULT = STREAM_DATA.join('');

export const createDataStream = () => {
    const data = [...STREAM_DATA];

    return new Readable({
        read() {
            this.push(data.shift() ?? null);
        },
    });
};
