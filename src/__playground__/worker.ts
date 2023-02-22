import { define } from 'nanolith';

export const worker = await define({
    exit1() {
        process.exit(1);
    },
    __beforeTask({ name }) {
        
    },
});
