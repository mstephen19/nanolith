import { jest } from '@jest/globals';
import { messengerTester } from './worker.js';
import { Messenger } from '../index.js';
import { isMessengerTransferObject } from '../messenger/index.js';

jest.setTimeout(10e3);

describe('Messenger', () => {
    it('Should be able to be instantiated with or without an ID', () => {
        expect(() => new Messenger()).not.toThrow();
        expect(() => new Messenger('hallo12321')).not.toThrow();
    });

    it('Should be able to be instantiated with a MessengerTransferData object', () => {
        const messenger2 = new Messenger({ __messengerID: 'foo' });

        expect(messenger2.ID).toBe('foo');
    });

    describe('transfer', () => {
        it('Should return a MessengerTransferData object', () => {
            const messenger = new Messenger();

            expect(isMessengerTransferObject(messenger.transfer())).toBe(true);
        });
    });

    describe('Message passing', () => {
        it('Should be able to send messages between the main thread and a worker', async () => {
            const messenger = new Messenger('testing');
            const callback = jest.fn(() => undefined);

            const service = await messengerTester.launchService({
                messengers: [messenger],
            });

            await service.call({
                name: 'registerListener',
            });

            const promise = new Promise((resolve) => {
                messenger.onMessage(() => {
                    callback();
                    resolve(true);
                });
            });

            messenger.sendMessage('foo');

            await promise;

            expect(callback).toBeCalledTimes(1);

            await service.close();
        });

        it('Should be able to send messages between workers', async () => {
            const messenger = new Messenger('testing');
            const callback = jest.fn(() => undefined);

            const service1 = await messengerTester.launchService({
                messengers: [messenger],
            });
            const service2 = await messengerTester.launchService({
                messengers: [messenger],
            });

            await service1.call({
                name: 'registerListener2',
            });
            await service2.call({
                name: 'registerListener2',
            });

            // A message will be sent back to the main thread when a message
            // was received on the Messenger within the service. Wait for these
            // notifications to be sent.
            const promise = new Promise((resolve) => {
                let received = 0;

                service1.onMessage(function cb() {
                    service1.offMessage(cb);
                    callback();
                    received++;
                    if (received === 2) resolve(true);
                });

                service2.onMessage(function cb() {
                    service1.offMessage(cb);
                    callback();
                    received++;
                    if (received === 2) resolve(true);
                });
            });

            await service1.call({ name: 'sendMessage' });
            await service2.call({ name: 'sendMessage' });

            await promise;

            expect(callback).toBeCalledTimes(2);

            await service1.close();
            await service2.close();
        });
    });
});
