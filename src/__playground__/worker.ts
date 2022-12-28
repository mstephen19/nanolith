// worker.ts 💼
import { define, SharedMap } from 'nanolith';
import type { SharedMapTransfer } from 'nanolith';

export const worker = await define({
    async handleMap(transfer: SharedMapTransfer<{ count: number }>) {
        const countMap = new SharedMap(transfer);

        for (let i = 1; i <= 1000; i++) {
            countMap.set('count', (prev) => {
                return +prev + 1;
            });
        }
    },
});
