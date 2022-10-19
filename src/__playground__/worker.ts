import { define } from '../index.js';

export const api = await define({
    add: async (x: number, y: number) => {
        await new Promise((r) => setTimeout(r, 2e3));
        return x + y;
    },
    __beforeTask: () => console.log('starting'),
    __afterTask: () => console.log('finished'),
    __initializeService: () => console.log('starting service'),
});
