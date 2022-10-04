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
};

export const api = await define(definitions);

export const dummy = await define({}, { file: 'foo', identifier: 'foo' });
