import { threadId } from 'worker_threads';
import { define, MainThread, MessengerList, SharedMap, SharedMapRawData } from '../index.js';
import { createDataStream } from './consts.js';

export const definitions = {
    add: (x: number, y: number) => {
        return x + y;
    },
    throw: () => {
        throw new Error('test');
    },
    registerListenerOnParent: () => {
        MainThread.onMessage(() => {
            MainThread.sendMessage('message received');
        });
    },
    registerAngryListenerOnParent: () => {
        MainThread.onMessage(() => {
            throw new Error('angry worker');
        });
    },
    waitABit: () => new Promise((resolve) => setTimeout(resolve, 2e3)),
    sendMessageToParent: () => {
        MainThread.sendMessage('data');
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
                MainThread.sendMessage('received a message');
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
        MainThread.onMessage<string>((data) => {
            if (!data.startsWith('notify-all')) return;
            MainThread.sendMessage('notify-all');
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
            MainThread.onMessage(() => {
                MainThread.sendMessage('test test');
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
        MainThread.onStream((stream) => {
            if (stream.metaData.id !== 'test') return;

            MainThread.sendMessage('stream received!');
        });
    },
    receiveStreamData() {
        MainThread.onStream((stream) => {
            if (stream.metaData.id !== 'test') return;

            const arr: string[] = [];

            stream.on('data', (data) => {
                arr.push(Buffer.from(data).toString('utf-8'));
            });

            stream.on('end', () => {
                MainThread.sendMessage(arr.join(''));
            });
        });
    },
    async sendStream() {
        const stream = createDataStream();
        stream.pipe(await MainThread.createStream({ id: 'test' }));
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
