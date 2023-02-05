import { define } from 'nanolith';

export const api = await define({
    foo() {
        throw new Error('fuck');
    },
});
