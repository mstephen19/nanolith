import { define, parent, messages } from '../index.js';

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
            const messenger = await messages.use('testing');

            messenger.onMessage(() => {
                messenger.sendMessage('hi from worker');
            });
        },
        registerListener2: async () => {
            const messenger = await messages.use('testing');

            messenger.onMessage(() => {
                parent.sendMessage('received a message');
            });
        },
        sendMessage: async () => {
            const messenger = await messages.use('testing');
            messenger.sendMessage('foo');
        },
    },
    { identifier: 'messengerTester' }
);
