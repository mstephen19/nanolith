import { pool } from '../pool/index.js';
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
});
