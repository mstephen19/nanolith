import { define } from '../index.js';

export const api = await define({
    add: () => {
        return 1 + 1;
    },
});
