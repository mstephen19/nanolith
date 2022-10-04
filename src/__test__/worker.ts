import { define, parent } from '../index.js';

export const definitions = {
    add: (x: number, y: number) => {
        return x + y;
    },
    throw: () => {
        throw new Error('test');
    },
    registerListenerOnParent: () => {
        parent.onMessage(() => {
            parent.sendMessage('message received');
        });
    },
    registerAngryListenerOnParent: () => {
        parent.onMessage(() => {
            throw new Error('angry worker');
        });
    },
};

export const api = await define(definitions);

export const api2 = await define(
    {
        hello: () => 'hello',
    },
    {
        identifier: '1234',
    }
);

export const dummy = await define({}, { file: 'foo', identifier: 'foo' });
