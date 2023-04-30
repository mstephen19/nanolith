import { MessengerList, define } from 'nanolith';

export const worker = await define({
    async throw() {
        throw new Error();
    },
    exit() {
        process.exit(1);
    },
    async __beforeTask() {
        const m = await MessengerList.use('receiver');
        console.log(m);
        m.sendMessage('before');
    },
    async __afterTask() {
        const m = await MessengerList.use('receiver');
        console.log(m);
        m.sendMessage('after');
    },
    foo() {
        return 'bar';
    },
});
