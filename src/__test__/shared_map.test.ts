import { SharedMap } from '@shared_map';
import { sharedMapTester } from './worker.js';

describe('SharedMap', () => {
    describe('Creation', () => {
        it('Should instantiate properly when provided an object', async () => {
            const map = new SharedMap({ foo: 'bar' });

            expect(await map.get('foo')).toBe('bar');
        });

        it('Should default to 1kb for keys and 3kb for values when provided an empty object and no config', () => {
            const map = new SharedMap({});

            expect(map.raw.__keys.byteLength).toBe(map.option.kilobyte);
            expect(map.raw.__values.byteLength).toBe(map.option.kilobyte * 3);
        });

        it('Should use the configuration options when provided them', () => {
            const map = new SharedMap(
                {},
                {
                    bytes: SharedMap.option.megabyte,
                }
            );

            expect(map.raw.__values.byteLength).toBe(map.option.megabyte);
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
        });

        it('Should return null for non-existent properties', async () => {
            const map = new SharedMap({
                foo: 'bar',
                hello: 'world',
                fizz: 'buzz',
                num: 24567,
            });

            //@ts-ignore
            expect(await map.get('weifjoweifj')).toBeNull();
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
        });

        it('Should have no issues with setting values on empty maps', async () => {
            const map = new SharedMap<Record<string, unknown>>({});

            await map.set('fizz', 'buzz');
            expect(await map.get('fizz')).toBe('buzz');
        });

        it('Should accept a callback that can set a new value based on the previous value', async () => {
            const map = new SharedMap({ count: 1 });

            await map.set('count', (prev) => {
                return +prev + 1;
            });

            expect(await map.get('count')).toBe('2');
        });

        it('Should set the value to null when provided with an empty string', async () => {
            const map = new SharedMap({ value: 'foo' });

            await map.set('value', '');
            expect(await map.get('value')).toBeNull();
        });
    });

    describe('Deleting', () => {
        it('Should set the value to null', async () => {
            const map = new SharedMap({ value: 'foo' });

            await map.delete('value');

            expect(await map.get('value')).toBeNull();
        });
    });

    describe('Sharing', () => {
        it('Should reflect changes made on other threads with access to the same map', async () => {
            const map = new SharedMap({ value: 'foo' });

            await sharedMapTester({ name: 'setNewValue', params: [map.raw] });

            expect(await map.get('value')).toBe('HELLO FROM WORKER!');
        });
    });

    describe('Mutex', () => {
        it('Should be able to handle multiple concurrent operations at a time without forming corrupted or incorrect data', async () => {
            const map = new SharedMap({ count: 0, count2: 0 });

            const { length } = await Promise.all([
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
                sharedMapTester({ name: 'add1000', params: [map.raw] }),
            ]);

            expect(await map.get('count')).toBe(`${length * 1e3}`);
        });
    });

    describe('entries', () => {
        it('Should asynchronously iterate through all keys and values in the map', async () => {
            const map = new SharedMap({ a: 1, b: 2, c: 3, d: 4 });

            const data: [string, string | null][] = [];

            for await (const entry of map.entries()) {
                data.push(entry);
            }

            expect(data).toEqual([
                ['a', '1'],
                ['b', '2'],
                ['c', '3'],
                ['d', '4'],
            ]);
        });
    });
});
