import { define } from 'nanolith';

export const worker = await define({
    async throw() {
        throw new Error();
    },
    exit() {
        process.exit(1);
    },
});
