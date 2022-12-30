import { jest } from '@jest/globals';
import { streamTester } from './worker.js';
import { createDataStream, STREAM_DATA_RESULT } from './consts.js';

import type { Service } from '../service/index.js';
import type { streamDefinitions } from './worker.js';
import { Messenger } from '@messenger';

jest.setTimeout(25e3);

describe('Streams', () => {
    let service: Service<typeof streamDefinitions>;

    beforeEach(async () => {
        service = await streamTester.launchService();
    });

    afterEach(async () => {
        await service.close();
    });

    describe('Main thread to Service', () => {
        it('Should successfully send the stream to the worker', async () => {
            const callback = jest.fn(() => undefined);

            await service.call({ name: 'receiveStream' });
            service.onMessage(callback);

            const stream = createDataStream();

            stream.pipe(await service.createStream({ id: 'test' }));

            await new Promise((r) => setTimeout(r, 1e3));

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith('stream received!');
        });

        it('Should stream all the data to the worker', async () => {
            const callback = jest.fn((x: string) => undefined);

            await service.call({ name: 'receiveStreamData' });

            const stream = createDataStream();
            const writable = await service.createStream({ id: 'test' });
            stream.pipe(writable);

            // Wait for the stream to finish and be confirmed to have finished
            await new Promise((r) => {
                service.onMessage((data) => {
                    callback(data);
                    r(data);
                });
            });

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(STREAM_DATA_RESULT);
        });
    });

    describe('Service to main thread', () => {
        it('Should receive streams from the Service', async () => {
            const callback = jest.fn((x: Record<any, any>) => undefined);

            const promise = new Promise((r) => {
                service.onStream((stream) => {
                    callback(stream.metaData);
                    r(true);
                });
            });

            await service.call({ name: 'sendStream' });
            await promise;

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ id: 'test' });
        });
        it('Should receive all the data from the worker', async () => {
            const callback = jest.fn((x: string) => undefined);

            const promise = new Promise((r) => {
                service.onStream((stream) => {
                    const arr: string[] = [];

                    stream.on('data', (data) => {
                        arr.push(Buffer.from(data).toString('utf-8'));
                    });

                    stream.on('end', () => {
                        callback(arr.join(''));
                        r(true);
                    });
                });
            });

            await service.call({ name: 'sendStream' });
            await promise;

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(STREAM_DATA_RESULT);
        });
    });

    describe('Streaming with Messenger', () => {
        it('Should successfully send streams along the messenger', async () => {
            const messenger = new Messenger('stream-messenger');

            const promise = new Promise((r) => {
                messenger.onStream(({ accept }) => {
                    const arr: string[] = [];

                    const stream = accept();

                    stream.on('data', (data) => {
                        arr.push(Buffer.from(data).toString('utf-8'));
                    });

                    stream.on('end', () => {
                        r(arr.join(''));
                    });
                });
            }) as Promise<string>;

            const service = await streamTester.launchService({
                messengers: [messenger],
            });

            await service.call({ name: 'sendStreamWithMessenger' });

            expect(await promise).toBe(STREAM_DATA_RESULT);

            await service.close();
        });
    });
});
