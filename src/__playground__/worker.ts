import { define } from 'nanolith';

export const worker = await define({
    wait() {
        return new Promise((r) => setTimeout(r, 5e3));
    },
    exit0() {
        process.exit(0);
    },
    exit1() {
        process.exit(1);
    },
});
