import { SharedMap, define } from '@nanolith';
import type { SharedMapTransfer } from '@nanolith';

export default await define({
    handler: async (transfer: SharedMapTransfer<Record<string, string>>) => {
        const map = new SharedMap(transfer);

        await map.set('fuck', 'TESTING');
    },
});
