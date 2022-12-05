import { Readable } from 'stream';

const STREAM_DATA = ['hello', 'world', 'foo', 'bar'];

export const STREAM_DATA_RESULT = STREAM_DATA.join('');

export const createDataStream = () => {
    const data = [...STREAM_DATA];

    return new Readable({
        read() {
            if (!data.length) return this.push(null);

            this.push(data.splice(0, 1)[0]);
        },
    });
};
