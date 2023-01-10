import { ServiceCluster } from '../index.js';
import { jest } from '@jest/globals';
import { clusterTester, clusterTesterDefinitions } from './worker.js';
import { Service } from '@service';

describe('ServiceCluster', () => {
    let cluster: ServiceCluster<typeof clusterTesterDefinitions>;

    beforeEach(() => {
        cluster = new ServiceCluster(clusterTester);
    });

    afterEach(async () => {
        await cluster.closeAll();
    });

    describe('launch', () => {
        it('Should launch the number of services specified', async () => {
            await cluster.launch(4);

            expect(cluster.activeServices).toBe(4);
        });

        it('Should always return an array of services', async () => {
            const x = await cluster.launch(1);

            expect(x).toBeInstanceOf(Array);
            expect(x).toHaveLength(1);
            expect(x[0]).toBeInstanceOf(Service);

            const y = await cluster.launch(2);

            expect(y).toBeInstanceOf(Array);
            expect(y).toHaveLength(2);
            expect(y[0]).toBeInstanceOf(Service);
            expect(y[1]).toBeInstanceOf(Service);
        });
    });

    it('Should accurately describe the number of active calls', async () => {
        const [service1, service2] = await cluster.launch(2);

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
            await cluster.launch(2);

            const p1 = cluster.use().call({ name: 'getThreadId' });
            const p2 = cluster.use().call({ name: 'getThreadId' });

            const [id1, id2] = await Promise.all([p1, p2]);

            expect(id1).not.toEqual(id2);
        });
    });

    describe('closeAll', () => {
        it('Should close all active services', async () => {
            await cluster.launch(5);

            await cluster.closeAll();

            expect(cluster.activeServices).toBe(0);
        });
    });

    describe('closeAllIdle', () => {
        it('Should close any idle services', async () => {
            await cluster.launch(2);

            cluster.use().call({ name: 'add', params: [1, 2] });

            await cluster.closeAllIdle();

            expect(cluster.activeServices).toBe(1);
        });
    });

    describe('notifyAll', () => {
        it('Should send a message to all services on the cluster', async () => {
            const callback = jest.fn(() => void true);
            await cluster.launch(5);

            cluster.currentServices.forEach(({ service }) => {
                service.onMessage(callback);
            });

            cluster.notifyAll('notify-all');

            await new Promise((r) => setTimeout(r, 2e3));

            expect(callback).toHaveBeenCalledTimes(5);
            expect(callback).toBeCalledWith('notify-all');
        });
    });
});
