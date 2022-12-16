import { define, SharedMap } from '../index.js';
import type { SharedMapTransferData } from '../index.js';

export const api = await define({
    async handleSharedMap(pair: SharedMapTransferData<{ foo: string; fizz: string; buzz: string }>) {
        const map = new SharedMap(pair);

        await map.set('buzz', 'xyzxyz');
    },
});
