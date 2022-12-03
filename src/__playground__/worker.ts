import { workerData } from 'worker_threads';
import { define } from '../index.js';

export const api = await define({
    __beforeTask() {
        console.log('running api1');
    },
    seek: () => {
        console.log(workerData);
    },
    add5: (num: number) => num + 5,
});

export const api2 = await define({
    __beforeTask() {
        console.log('running api2');
    },
    something: () => {
        // console.log(workerData);
        return workerData;
    },
    cool: () => 'foo',
    test: () => 'xyz',
});
