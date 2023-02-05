import { threadId } from 'worker_threads';
import { define, ParentThread, MessengerList, SharedMap, SharedMapRawData } from '../index.js';
import { createDataStream } from './consts.js';

export const definitions = {
    add: (x: number, y: number) => {
        return x + y;
    },
    throw: () => {
        throw new Error('test');
    },
    registerListenerOnParent: () => {
        ParentThread.onMessage(() => {
            ParentThread.sendMessage('message received');
        });
    },
    registerAngryListenerOnParent: () => {
        ParentThread.onMessage(() => {
            throw new Error('angry worker');
        });
    },
    waitABit: () => new Promise((resolve) => setTimeout(resolve, 2e3)),
    sendMessageToParent: () => {
        ParentThread.sendMessage('data');
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
            const messenger = await MessengerList.use('testing');

            messenger.onMessage(() => {
                messenger.sendMessage('hi from worker');
            });
        },
        registerListener2: async () => {
            const messenger = await MessengerList.use('testing');

            messenger.onMessage(() => {
                ParentThread.sendMessage('received a message');
            });
        },
        sendMessage: async () => {
            const messenger = await MessengerList.use('testing');
            messenger.sendMessage('foo');
        },
        getList: () => Object.keys(MessengerList.list),
    },
    { identifier: 'messengerTester' }
);

export const clusterTesterDefinitions = {
    __initializeService() {
        ParentThread.onMessage<string>((data) => {
            if (!data.startsWith('notify-all')) return;
            ParentThread.sendMessage('notify-all');
        });
    },
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
            ParentThread.onMessage(() => {
                ParentThread.sendMessage('test test');
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
        ParentThread.onStream((stream) => {
            if (stream.metaData.id !== 'test') return;

            ParentThread.sendMessage('stream received!');
        });
    },
    receiveStreamData() {
        ParentThread.onStream((stream) => {
            if (stream.metaData.id !== 'test') return;

            const arr: string[] = [];

            stream.on('data', (data) => {
                arr.push(Buffer.from(data).toString('utf-8'));
            });

            stream.on('end', () => {
                ParentThread.sendMessage(arr.join(''));
            });
        });
    },
    async sendStream() {
        const stream = createDataStream();
        stream.pipe(await ParentThread.createStream({ id: 'test' }));
    },
    async sendStreamWithMessenger() {
        const messenger = await MessengerList.use('stream-messenger');

        createDataStream().pipe(await messenger.createStream());
    },
};

export const streamTester = await define(streamDefinitions);

export const sharedMapTester = await define({
    async setNewValue(transfer: SharedMapRawData<{ value: string }>) {
        const map = new SharedMap(transfer);

        await map.set('value', 'HELLO FROM WORKER!');
    },
    async add1000(transfer: SharedMapRawData<{ count: number }>) {
        const map = new SharedMap(transfer);

        for (let i = 1; i <= 1e3; i++) {
            await map.set('count', (prev) => +prev + 1);
        }
    },
});
