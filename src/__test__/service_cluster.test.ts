import { ServiceCluster } from '../index.js';
import { Nanolith } from '../types/nanolith.js';
import { clusterTester, clusterTesterDefinitions } from './worker.js';

describe('ServiceCluster', () => {
    let cluster: ServiceCluster<typeof clusterTesterDefinitions>;

    beforeEach(() => {
        cluster = new ServiceCluster(clusterTester);
    });

    afterEach(async () => {
        await cluster.closeAll();
    });

    it('Should accurately describe the number of active services', async () => {
        await cluster.launchService();
        await cluster.launchService();
        await cluster.launchService();
        await cluster.launchService();

        expect(cluster.activeServices).toBe(4);
    });

    it('Should accurately describe the number of active calls', async () => {
        const service1 = await cluster.launchService();
        const service2 = await cluster.launchService();

        const p1 = service1!.call({
            name: 'add',
            params: [1, 2],
        });

        const p2 = service2!.call({
            name: 'add',
            params: [1, 2],
        });

        expect(cluster.activeServiceCalls).toBe(2);
        await Promise.all([p1, p2]);
        expect(cluster.activeServiceCalls).toBe(0);
    });

    describe('use', () => {
        it('Should choose the least active service', async () => {
            await cluster.launchService();
            await cluster.launchService();

            const p1 = cluster.use().call({ name: 'getThreadId' });
            const p2 = cluster.use().call({ name: 'getThreadId' });

            const [id1, id2] = await Promise.all([p1, p2]);

            expect(id1).not.toEqual(id2);
        });
    });
});
