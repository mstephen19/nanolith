import { define } from '../index.js';

export const api = await define({
    __initializeService: () => {
        console.log('hello');
    },
    add: async (x: number, y: number) => {
        await new Promise((r) => setTimeout(r, 2e3));
        return x + y;
    },
});
