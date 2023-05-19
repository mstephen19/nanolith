import { ParentThread, define } from 'nanolith';

export const worker = await define({
    __initializeService() {
        console.log('throwing error');
        throw new Error();
    },
    async task() {
        while (true) {
            await new Promise((r) => setTimeout(r, 1e3));
            ParentThread.sendMessage('foo');
        }
    },
});
