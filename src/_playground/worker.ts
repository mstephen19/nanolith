import { BroadcastChannel } from 'worker_threads';
import { define, parent } from '../index.js';

export const api = await define({
    registerMessengerListener: () => {
        parent.onMessengerReceived((messenger) => {
            // messenger.sendMessage('hey from worker!');
            console.log('messenger received');
            messenger.onMessage<string>((data) => console.log(data, 'in worker'));
            // console.log(messenger);
        });

        // new BroadcastChannel('test').onmessage = (event) => {
        //     console.log(event);
        // };
    },
});
