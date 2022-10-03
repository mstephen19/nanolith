import { BroadcastChannel } from 'worker_threads';
import { define, parent } from '../index.js';

export const api = await define({
    receiveChannel: (name: string) => {
        console.log(name);

        const channel = new BroadcastChannel(name);

        console.log(channel);

        channel.onmessage = (data) => {
            console.log(data);
        };
    },
});
