import { define } from 'nanolith';
import { workerData } from 'worker_threads';

export const api = await define(
    {
        foo() {
            console.log(workerData);
        },
    },
    { safeMode: false }
);

export const api2 = await define(
    {
        async bar() {
            await api({ name: 'foo' });
        },
    },
    { safeMode: false }
);
