import { SharedMap, define } from '@nanolith';
import type { SharedMapTransfer } from '@nanolith';

export default await define({
    handler: async (transfer: SharedMapTransfer<{ count: number }>) => {
        const map = new SharedMap(transfer);

        for (let i = 1; i <= 1000; i++) {
            await map.set('count', (prev) => +prev + 1);
        }
    },
});
