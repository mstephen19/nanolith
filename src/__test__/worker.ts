import { threadId } from 'worker_threads';
import { define, parent, messengers } from '../index.js';

import type { TaskDefinitions } from '../index.js';
import { createDataStream } from './consts.js';

export const definitions = {
    add: (x: number, y: number) => {
        return x + y;
    },
    throw: () => {
        throw new Error('test');
    },
    registerListenerOnParent: () => {
        parent.onMessage(() => {
            parent.sendMessage('message received');
        });
    },
    registerAngryListenerOnParent: () => {
        parent.onMessage(() => {
            throw new Error('angry worker');
        });
    },
    waitABit: () => new Promise((resolve) => setTimeout(resolve, 2e3)),
    sendMessageToParent: () => {
        parent.sendMessage('data');
    },
};

export const api = await define(definitions);

export const api2 = await define(
    {
        hello: () => 'hello',
    },
    {
        identifier: '1234',
    }
);

export const dummy = await define({}, { file: 'foo', identifier: 'foo' });

export const messengerTester = await define(
    {
        registerListener: async () => {
            const messenger = await messengers.use('testing');

            messenger.onMessage(() => {
                messenger.sendMessage('hi from worker');
            });
        },
        registerListener2: async () => {
            const messenger = await messengers.use('testing');

            messenger.onMessage(() => {
                parent.sendMessage('received a message');
            });
        },
        sendMessage: async () => {
            const messenger = await messengers.use('testing');
            messenger.sendMessage('foo');
        },
    },
    { identifier: 'messengerTester' }
);

export const clusterTesterDefinitions = {
    async add(x: number, y: number) {
        await new Promise((r) => setTimeout(r, 3e3));
        return x + y;
    },
    getThreadId: () => {
        return threadId;
    },
};

export const clusterTester = await define(clusterTesterDefinitions, { identifier: 'clusterTester' });

export const testServiceInitializer = await define(
    {
        __initializeService: () => {
            parent.onMessage(() => {
                parent.sendMessage('test test');
            });
        },
    },
    { identifier: 'foo-bar-baz-buzz' }
);

export const hookTester = await define(
    {
        __beforeTask() {
            process.exit();
        },
        add() {
            return 1 + 1;
        },
    },
    { identifier: 'hook-tester-123' }
);

export const streamDefinitions = {
    receiveStream() {
        parent.onStream((stream) => {
            if (stream.metaData.id !== 'test') return;

            parent.sendMessage('stream received!');
        });
    },
    receiveStreamData() {
        parent.onStream((stream) => {
            if (stream.metaData.id !== 'test') return;

            const arr: string[] = [];

            stream.on('data', (data) => {
                arr.push(Buffer.from(data).toString('utf-8'));
            });

            stream.on('end', () => {
                parent.sendMessage(arr.join(''));
            });
        });
    },
    async sendStream() {
        const stream = createDataStream();
        stream.pipe(await parent.createStream({ id: 'test' }));
    },
};

export const streamTester = await define(streamDefinitions);
