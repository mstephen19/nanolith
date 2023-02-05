import { define } from 'nanolith';
import { workerData } from 'worker_threads';

export const api = await define({
    foo() {
        console.log(workerData);
    },
});
