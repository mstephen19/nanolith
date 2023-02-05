import { fileURLToPath } from 'url';
import path from 'path';
import { define } from 'nanolith';
import { Service } from '../service/index.js';
import { api2, api, dummy, hookTester } from './worker.js';

describe('define', () => {
    it('Should contain the anticipated properties', () => {
        expect(typeof api).toBe('function');

        expect(api).toHaveProperty('file');
        expect(typeof api.file).toBe('string');

        expect(api).toHaveProperty('launchService');
        expect(typeof api.launchService).toBe('function');
    });

    it('Should not not clash with other sets of definitions when assigned a unique identifier', async () => {
        expect(api2({ name: 'hello' })).resolves.toBe('hello');
    });

    describe('file', () => {
        it('Should provide the filename for the file where the functions were defined', () => {
            const __dirname = fileURLToPath(new URL('.', import.meta.url));

            expect(dummy.file).toBe('foo');
            expect(api.file).toBe(path.join(__dirname, './worker.js'));
        });
    });

    describe('Calling directly (Tasks)', () => {
        it('Should return a promise', () => {
            expect(api({ name: 'add', params: [1, 2] })).toBeInstanceOf(Promise);
        });

        it("Should resolve with the function's return value", () => {
            expect(api({ name: 'add', params: [1, 2] })).resolves.toBe(3);
            expect(api({ name: 'add', params: [4, 5] })).resolves.toBe(9);
        });

        it('Should reject when an error is thrown', () => {
            expect(api({ name: 'throw' })).rejects.toThrowError(new Error('test'));
        });
    });

    describe('launchService', () => {
        it('Should return a promise resolving with a Service instance', async () => {
            const promise = api.launchService();

            expect(promise).toBeInstanceOf(Promise);
            expect(promise).resolves.toBeInstanceOf(Service);

            await (await promise).close();
        });
    });

    describe('earlyExitHandler', () => {
        it('Should not allow the call to hang and should reject the promise if the worker exits early', () => {
            expect(hookTester({ name: 'add' })).rejects.toThrowError(new Error('Worker exited early with code 0!'));
        });
    });

    describe('safeMode', () => {
        it('Should prevent a worker from being called in the same file', async () => {
            const api = await define({
                foo() {},
            });

            expect(api({ name: 'foo' })).rejects.toThrowError();
        });
    });

    // todo: Test hooks for tasks
    // describe('Hooks', () => {
    //     describe('__beforeTask', () => {
    //         it('Should run before a task is run', ())
    //     });
    // });
});
