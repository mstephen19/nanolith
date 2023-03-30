import { createWriteStream } from 'fs';
import { ParentThread, define } from 'nanolith';

export const worker = await define({
    async wait() {
        await new Promise((r) => setTimeout(r, 5e3));
        console.log('done');
    },
});
