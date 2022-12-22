import { define, SharedMap } from '@nanolith';
import type { SharedMapTransfer } from '@nanolith';

export default await define({
    // Expect to receive a transfer object for a SharedMap with a property
    // of "foo" which is a string.
    async myHandler(transfer: SharedMapTransfer<{ foo: string }>) {
        // Wrap the transfer object in a SharedMap instance so it can be
        // interacted with.
        const map = new SharedMap(transfer);

        // Log out the current value of "foo".
        console.log(await map.get('foo'));

        // Set a new value for "foo". This change can be seen on all threads.
        await map.set('foo', 'set in the worker');

        // Close the instance, allowing the task to finish.
        map.close();
    },
});
