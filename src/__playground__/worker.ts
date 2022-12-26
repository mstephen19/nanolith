// worker.ts 💼
import { define } from 'nanolith';

export const worker = await define({
    __initializeService(threadId) {
        console.log(`Initializing service on ${threadId}`);
    },
    __beforeTask({ name, inService }) {
        console.log(`Running task ${name}.`);
        console.log(`${inService ? 'Is' : 'Is not'} in a service.`);
    },
    __afterTask({ name, inService }) {
        console.log(`Finished task ${name}`);
    },
    add(x: number, y: number) {
        return x + y;
    },
    async waitThenAdd(x: number, y: number) {
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        return x + y;
    },
    subtract,
});

function subtract(x: number, y: number) {
    return x - y;
}
