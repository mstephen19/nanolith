import { define } from 'nanolith';

export const worker = await define({
    foo() {
        return new Uint16Array();
    },
});
