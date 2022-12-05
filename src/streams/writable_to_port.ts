import { Writable } from 'stream';
import { StreamMessageType } from '../types/streams.js';

import type { Messagable, StreamChunkMessageBody, StreamEndMessageBody } from '../types/streams.js';

export class WritableToPort<Target extends Messagable> extends Writable {
    // The unique ID for the data stream.
    #id: string;
    // The target to send the chunks to.
    #target: Target;
    // // Whether or not the port has notified that it
    // // is ready to start receiving chunks.
    // #ready = false;
    // Various metadata that can be attached to the stream and carried
    // over to the receiving port so that the user can identify it
    // properly.
    #meta: Record<any, any>;

    get metaData() {
        return this.#meta;
    }

    constructor(target: Target, id: string, metaData = {} as Record<any, any>) {
        super();
        // // We need to buffer chunks into memory until the target notifies
        // // that it is ready to start receiving data.
        // this.cork();
        this.#target = target;
        this.#id = id;
        this.#meta = metaData;

        // Once the stream is finished, notify the readable stream on the other
        // end so that it can end itself.
        this.once('finish', () => {
            const body: StreamEndMessageBody = {
                type: StreamMessageType.End,
                id: this.#id,
            };

            target.postMessage(body);
            // ? Perhaps destroy the stream ?
            this.destroy();
        });
    }

    _write(chunk: Buffer, _: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
        // if (!this.#ready) return callback();
        // if (!(chunk instanceof Buffer)) callback(new Error('Can only send "Buffer" instances in a WritableToPort stream!'));

        const body: StreamChunkMessageBody = {
            type: StreamMessageType.Chunk,
            id: this.#id,
            data: chunk,
        };

        this.#target.postMessage(body);
        callback();
    }
}