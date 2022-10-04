import { define, parent } from '../index.js';

export const api = await define({
    throwOnMessage: () => {
        parent.onMessage(() => {
            throw new Error('fuck');
        });
    },
    add: (x: number, y: number) => x + y,
});
