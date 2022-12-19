import { define, SharedMap } from '../index.js';
import type { SharedMapTransfer } from '../index.js';

export const api = await define({
    async handleSharedMap(pair: SharedMapTransfer<{ count: number }>) {
        const map = new SharedMap(pair);

        for (let i = 1; i <= 100_000; i++) {
            await map.set('count', +(await map.get('count'))! + 1);
        }
    },
});
