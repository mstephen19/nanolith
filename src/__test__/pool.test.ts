import { pool } from '../pool/index.js';
import { ConcurrencyOption } from '../types/pool.js';
import { cpus } from 'os';
import { api } from './worker.js';

describe('Pool', () => {
    describe('enqueue', () => {
        it('Should increase the number of active workers once a worker is created', async () => {
            const service = await api.launchService();
            expect(pool.activeCount).toBe(1);

            const service2 = await api.launchService();
            expect(pool.activeCount).toBe(2);

            service.close();
            service2.close();
        });
    });

    it('Should prevent more than the concurrency from running at one time', async () => {
        pool.setConcurrency(ConcurrencyOption.x1);

        const promise = Promise.all(
            [...Array(50).keys()].map(() =>
                (async () => {
                    await api({ name: 'add', params: [1, 2] });
                })()
            )
        );

        expect(pool.activeCount).toBe(cpus().length);

        await promise;
    });

    it('Should eventually run all workers queued into it', async () => {
        pool.setConcurrency(ConcurrencyOption.x1);

        let total = 0;

        await Promise.all(
            [...Array(50).keys()].map(() =>
                (async () => {
                    const value = await api({ name: 'add', params: [1, 0] });
                    total += value;
                })()
            )
        );

        expect(total).toBe(50);
    });
});
