import { SharedMap } from '@shared_map';
import { jest } from '@jest/globals';
import { sharedMapTester } from './worker.js';

describe('SharedMap', () => {
    describe('Creation', () => {
        it('Should instantiate properly when provided an object', async () => {
            const map = new SharedMap({ foo: 'bar' });

            expect(await map.get('foo')).toBe('bar');

            map.close();
        });

        it('Should default to 1kb for keys and 3kb for values when provided an empty object and no config', () => {
            const map = new SharedMap({});

            expect(map.transfer.__keys.byteLength).toBe(map.option.kilobyte);
            expect(map.transfer.__values.byteLength).toBe(map.option.kilobyte * 3);

            map.close();
        });

        it('Should use the configuration options when provided them', () => {
            const map = new SharedMap(
                {},
                {
                    bytes: SharedMap.option.megabyte,
                }
            );

            expect(map.transfer.__values.byteLength).toBe(map.option.megabyte);

            map.close();
        });
    });

    describe('Getting', () => {
        it('Should successfully get the value stored under the key', async () => {
            const map = new SharedMap({
                foo: 'bar',
                hello: 'world',
                fizz: 'buzz',
                num: 24567,
            });

            expect(await map.get('foo')).toBe('bar');
            expect(await map.get('hello')).toBe('world');
            expect(await map.get('fizz')).toBe('buzz');
            expect(await map.get('num')).toBe('24567');

            map.close();
        });
    });

    describe('Setting', () => {
        it('Should successfully modify an existing value', async () => {
            const map = new SharedMap({
                foo: 'bar',
                hello: 'world',
                fizz: 'buzz',
                num: 24567,
            });

            // Modifying a value in the middle
            await map.set('hello', 'WORLD_WORLD_WORLD_WORLD');

            expect(await map.get('hello')).toBe('WORLD_WORLD_WORLD_WORLD');
            // These values should remain the same
            expect(await map.get('fizz')).toBe('buzz');
            expect(await map.get('num')).toBe('24567');

            // Modifying a value at the end
            await map.set('num', 77777777);
            expect(await map.get('num')).toBe('77777777');

            map.close();
        });

        it("Should add a new value to the map if it doesn't already exist there", async () => {
            const map = new SharedMap<Record<string, unknown>>({
                foo: 'bar',
                hello: 'world',
                fizz: 'buzz',
                num: 24567,
            });

            await map.set('testing', 123);
            expect(await map.get('testing')).toBe('123');

            map.close();
        });

        it('Should have no issues with setting values on empty maps', async () => {
            const map = new SharedMap<Record<string, unknown>>({});

            await map.set('fizz', 'buzz');
            expect(await map.get('fizz')).toBe('buzz');

            map.close();
        });

        it('Should accept a callback that can set a new value based on the previous value', async () => {
            const map = new SharedMap({ count: 1 });

            await map.set('count', (prev) => {
                return +prev + 1;
            });

            expect(await map.get('count')).toBe('2');

            map.close();
        });

        it('Should set the value to null when provided with an empty string', async () => {
            const map = new SharedMap({ value: 'foo' });

            await map.set('value', '');
            expect(await map.get('value')).toBe('null');

            map.close();
        });
    });

    describe('Watch', () => {
        it('Should detect changes on a specific key', async () => {
            const callback = jest.fn((_: string | null) => void true);

            const map = new SharedMap({ value: 'foo' });
            const value = await map.watch('value');

            const promise = new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (!value.changed) return;

                    callback(value.current);
                    clearInterval(interval);
                    resolve(true);
                    map.close();
                }, 1e3);
            });

            await map.set('value', 'fooBar');

            await promise;

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith('fooBar');
        });
    });

    describe('Sharing', () => {
        it('Should reflect changes made on other threads with access to the same map', async () => {
            const map = new SharedMap({ value: 'foo' });

            await sharedMapTester({ name: 'setNewValue', params: [map.transfer] });

            expect(await map.get('value')).toBe('HELLO FROM WORKER!');

            map.close();
        });
    });

    describe('Mutex', () => {
        it('Should be able to handle multiple concurrent operations at a time without forming corrupted or incorrect data', async () => {
            const map = new SharedMap({ count: 0 });

            const { length } = await Promise.all([
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
                sharedMapTester({ name: 'add1000', params: [map.transfer] }),
            ]);

            expect(await map.get('count')).toBe(`${length * 1e3}`);

            map.close();
        });
    });
});
