import { jest } from '@jest/globals';
import { api } from './worker.js';

import type { Service } from '../service/index.js';
import type { definitions } from './worker.js';

describe('Service', () => {
    let service: Service<typeof definitions>;

    beforeEach(async () => {
        service = await api.launchService();
    });

    afterEach(() => {
        service.close();
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
    });
});
