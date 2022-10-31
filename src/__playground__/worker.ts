import { workerData } from 'worker_threads';
import { define } from '../index.js';

export const api = await define({
    seek: () => {
        console.log(workerData);
    },
});
