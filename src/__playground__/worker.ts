import { define, parent } from '../index.js';

export const definitions = {
    throwErrorOnMessage: () => {
        parent.onMessage(() => {
            throw new Error('fuck');
        });
    },
    test: () => 'hello',
};

export const api = await define(definitions);

export const dummy = await define({}, { file: 'foo', identifier: 'foo' });
