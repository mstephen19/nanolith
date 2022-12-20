import { TypedEmitter } from 'tiny-typed-emitter';
import { BroadcastChannel } from 'worker_threads';

import type { EventMap, BroadcastChannelEmitterPostMessageBody } from '@typing/shared_map.js';

export class BroadcastChannelEmitter<Events extends EventMap> extends TypedEmitter<Events> {
    // The underlying
    #channel: BroadcastChannel;

    constructor(identifier: string) {
        super();
        // .on, .once, and .emit are already implemented since we're extending EventEmitter.
        // We just need to worry about emitting events when messages are received (onmessage)
        // and implementing a .send method so messages can be sent on the channel as well.

        this.#channel = new BroadcastChannel(identifier);
        // ! Channel needs to be unreffed maybe?
        // this.#channel.unref();

        // Emit an event each time a message is received. The name of the event corresponds to
        this.#channel.onmessage = (event) => {
            const { data } = event as { data: BroadcastChannelEmitterPostMessageBody<Events> };
            this.emit(data.name, ...data.value);
        };
    }

    send<Key extends keyof Events>(name: Key, ...value: Parameters<Events[Key]>) {
        const body: BroadcastChannelEmitterPostMessageBody<Events, Key> = {
            name,
            value,
        };

        this.#channel.postMessage(body);
    }
}
