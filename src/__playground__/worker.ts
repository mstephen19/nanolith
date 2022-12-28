// worker.ts 💼
import { define, SharedMap } from 'nanolith';
import type { SharedMapTransfer } from 'nanolith';

export const worker = await define({
    // Create a task that accept a transfer object that can be converted into a
    // SharedMap instance.
    async handleMap(transfer: SharedMapTransfer<{ count: number }>) {
        // Instantiate a SharedMap instance based on the received transfer.
        const countMap = new SharedMap(transfer);

        // Increment the count a thousand times.
        for (let i = 1; i <= 1000; i++) {
            // Use a callback function inside ".set()" to set the new value based
            // on the previously existing value.
            await countMap.set('count', (prev) => {
                return +prev + 1;
            });
        }
    },
});
