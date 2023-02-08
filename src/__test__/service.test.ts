import { jest } from '@jest/globals';
import { api, hookTester, testServiceInitializer } from './worker.js';

import type { Service } from '../service/index.js';
import type { definitions } from './worker.js';

describe('Service', () => {
    let service: Service<typeof definitions>;

    beforeEach(async () => {
        service = await api.launchService();
    });

    afterEach(async () => {
        await service.close();
    });

    it('Should allow for the sending and receiving of messages between the main thread and the worker', async () => {
        // Registers a listener that sends a message back to the parent when
        // a message is received in the worker. Allows for simple testing of
        // back and forth communication.
        await service.call({ name: 'registerListenerOnParent' });

        const callback = jest.fn((data) => data);

        const promise = new Promise((resolve) => {
            service.onMessage<string>((data) => {
                callback(data);
                resolve(undefined);
            });
        });

        service.sendMessage('foo');

        await promise;

        expect(callback).toBeCalled();
        expect(callback).toBeCalledTimes(1);
        expect(callback).toReturnWith('message received');
    });

    describe('call', () => {
        it("Should return a promise resolving with the definition's return value", async () => {
            const promise = service.call({
                name: 'add',
                params: [5, 5],
            });

            expect(promise).toBeInstanceOf(Promise);
            expect(promise).resolves.toBe(10);
        });

        it('Should reject the promise if the process is exited during the task', async () => {
            const s = await hookTester.launchService();
            expect(s.call({ name: 'add' })).rejects.toThrowError(new Error('Worker exited early with code 0!'));

            await s.close();
            await service.close();
        });

        it('Should reject the promise when the function throws, but should not shut down the service', async () => {
            const promise = service.call({ name: 'throw' });

            expect(promise).rejects.toThrowError(new Error('test'));

            // Despite throwing, this should still work
            const data = await service.call({
                name: 'add',
                params: [5, 5],
            });

            expect(data).toBe(10);
        });

        it('Should throw an error when called on a service that has been closed', async () => {
            await service.close();

            const promise = service.call({
                name: 'add',
                params: [1, 2],
            });

            expect(promise).rejects.toThrowError();
        });
    });

    it('Should accurately state the number of active calls', async () => {
        const p1 = service.call({ name: 'waitABit' });
        const p2 = service.call({ name: 'waitABit' });

        expect(service.activeCalls).toBe(2);

        await Promise.all([p1, p2]);

        expect(service.activeCalls).toBe(0);
    });

    describe('exceptionHandler', () => {
        it('Should run the handler and not shut down the service when an uncaught exception is thrown', async () => {
            const handler = jest.fn(({ error }) => error.message);

            const service2 = await api.launchService({
                // @ts-ignore
                exceptionHandler: handler,
            });

            await service2.call({ name: 'registerAngryListenerOnParent' });
            service2.sendMessage('foo');

            // Allow time for the message to be sent to the main thread
            // and for the handler to be called.
            await new Promise((resolve) => setTimeout(resolve, 3e3));

            expect(handler).toBeCalled();
            expect(handler).toBeCalledTimes(1);
            expect(handler).toReturnWith('angry worker');

            // We should still be able to call the service
            expect(await service.call({ name: 'add', params: [1, 2] })).toBe(3);

            await service2.close();
        });

        it('Should terminate the service when "terminate" is called', async () => {
            const handler = jest.fn(({ terminate }) => terminate());

            const service2 = await api.launchService({
                // @ts-ignore
                exceptionHandler: handler,
            });

            await service2.call({ name: 'registerAngryListenerOnParent' });
            service2.sendMessage('foo');

            await new Promise((resolve) => setTimeout(resolve, 2e3));

            expect(service2.closed).toBe(true);
        });
    });

    describe('Hooks', () => {
        describe('__initializeService', () => {
            it('Should run immediately when the service is launched without being called manually', async () => {
                const handler = jest.fn((data: string) => data);

                const service = await testServiceInitializer.launchService();

                service.onMessage(handler);
                service.sendMessage('foo');

                await new Promise((resolve) => setTimeout(resolve, 2e3));

                await service.close();

                expect(handler).toHaveBeenCalledTimes(1);
                expect(handler).toHaveBeenCalledWith('test test');
            });
        });
        // todo: Test hooks for tasks
        // describe('__beforeTask', () => {
        //     it('Should run before a task is run', ())
        // });
    });

    describe('listenerRemover', () => {
        it('Should remove the listener for messages', async () => {
            const handler = jest.fn((data: string) => data);

            const off = service.onMessage<string>((data) => {
                handler(data);
                // remove the listener right when the first message is received
                off();
            });

            await service.call({ name: 'sendMessageToParent' });
            await service.call({ name: 'sendMessageToParent' });
            await service.call({ name: 'sendMessageToParent' });
            await service.call({ name: 'sendMessageToParent' });

            expect(handler).toHaveBeenCalledTimes(1);
        });
    });
});
