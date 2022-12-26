// worker.ts 💼
import { define } from 'nanolith';

// Exporting the variable is not a requirement, but it is
// necessary to somehow export the resolved value of the
// function in order to have access to it later on.
export const worker = await define({
    add(x: number, y: number) {
        return x + y;
    },
    async waitThenAdd(x: number, y: number) {
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        return x + y;
    },
    // Functions don't have to be directly defined within the
    // object, they can be defined elsewhere outside, or even
    // imported from a totally different module.
    subtract,
});

function subtract(x: number, y: number) {
    return x - y;
}
