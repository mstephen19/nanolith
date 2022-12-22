import { Writable } from 'stream';
import { StreamMessageType } from '@constants/streams.js';

import type { Messagable, StreamChunkMessageBody, StreamEndMessageBody } from '@typing/streams.js';

/**
 * A `Writable` stream that a `Readable` stream can pipe into in order to
 * stream data between threads.
 */
export class WritableToPort<Target extends Messagable> extends Writable {
    // The unique ID for the data stream.
    #id: string;
    // The target to send the chunks to.
    #target: Target;
    // Various metadata that can be attached to the stream and carried
    // over to the receiving port so that the user can identify it
    // properly.
    #meta: Record<any, any>;

    /**
     * The object containing any meta data about the stream that can be
     * used to identify it.
     */
    get metaData() {
        return this.#meta;
    }

    constructor(target: Target, id: string, metaData = {} as Record<any, any>) {
        super();
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
            this.destroy();
        });
    }

    _write(chunk: Buffer, _: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
        const body: StreamChunkMessageBody = {
            type: StreamMessageType.Chunk,
            id: this.#id,
            data: chunk,
        };

        this.#target.postMessage(body);
        callback();
    }
}
