import { define } from '@nanolith';

export default await define({
    __beforeTask(context) {
        console.log('before', context);
    },
    __afterTask(context) {
        console.log('after', context);
    },
    async foo() {
        // await new Promise((r) => setTimeout(r, 10e3));
        return 'foo';
    },
});
