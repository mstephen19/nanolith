import { define } from '../index.js';

export const api = await define({
    add: async (x: number, y: number) => {
        await new Promise((r) => setTimeout(r, 1e3));
        return x + y;
    },
});
