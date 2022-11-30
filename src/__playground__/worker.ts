import { workerData } from 'worker_threads';
import { define } from '../index.js';

export const api = await define({
    seek: () => {
        console.log(workerData);
    },
    add5: (num: number) => num + 5,
});
