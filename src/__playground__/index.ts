import { define } from '../index.js';

const api = await define({
    add: () => {
        return 1 + 1;
    },
});

await api({ name: 'add' });
