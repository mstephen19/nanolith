import { Writable } from 'stream';
import { randomUUID as v4 } from 'crypto';
import { StreamMessageType } from '../types/streams.js';

import type {
    Messagable,
    StreamChunkMessageBody,
    StreamReadyMessageBody,
    StreamEndMessageBody,
    StreamStartMessageBody,
} from '../types/streams.js';

export class WritableToPort<Target extends Messagable> extends Writable {
    // The unique ID for the data stream.
    #id = v4();
    // The target to send the chunks to.
    #target: Target;
    // Whether or not the port has notified that it
    // is ready to start receiving chunks.
    #ready = false;
    // Various metadata that can be attached to the stream and carried
    // over to the receiving port so that the user can identify it
    // properly.
    #meta: Record<any, any>;

    get metaData() {
        return this.#meta;
    }

    constructor(target: Target, metaData = {} as Record<any, any>) {
        super();
        // We need to buffer chunks into memory until the target notifies
        // that it is ready to start receiving data.
        this.cork();
        this.#target = target;
        this.#meta = metaData;

        // When the target notifies that it is ready to start receiving
        // chunks, uncork the writable stream and mark it as ready.
        const readyHandler = (data: StreamReadyMessageBody) => {
            if (data.type !== StreamMessageType.Ready) return;
            if (data.id !== this.#id) return;

            this.uncork();
            this.#ready = true;

            // Clean up the listener, effectively acting as a .once
            target.off('message', readyHandler);
        };
        target.on('message', readyHandler);

        // Notify the target that a new stream is starting with the generated
        // ID and user-provided metadata.
        const body: StreamStartMessageBody = {
            type: StreamMessageType.Start,
            id: this.#id,
            meta: this.#meta,
        };
        target.postMessage(body);

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
        if (!this.#ready) return callback();
        if (!(chunk instanceof Buffer)) callback(new Error('Can only send "Buffer" instances in a WritableToPort stream!'));

        const body: StreamChunkMessageBody = {
            type: StreamMessageType.Chunk,
            id: this.#id,
            data: chunk,
        };

        this.#target.postMessage(body);
        callback();
    }
}
