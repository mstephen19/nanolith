import { Readable } from 'stream';
import { StreamMessageType } from '@constants/streams.js';

import type { Messagable, StreamChunkMessageBody, StreamBaseMessageBody, StreamEndMessageBody } from '@typing/streams.js';

/**
 * A `Readable` stream that allows for reading and handling data streamed
 * from another thread.
 */
export class ReadableFromPort<Sender extends Messagable> extends Readable {
    #id: string;
    #sender: Sender;
    #meta: Record<any, any>;
    #registered = false;

    /**
     * The object containing any meta data about the stream that can be
     * used to identify it.
     */
    get metaData() {
        return this.#meta;
    }

    constructor(id: string, sender: Sender, metaData = {} as Record<any, any>) {
        super();

        this.#meta = metaData;
        this.#id = id;
        this.#sender = sender;
    }

    _read() {
        if (this.#registered) return;
        // Register the listener only once
        const handler = (data: StreamBaseMessageBody) => {
            switch (data.type) {
                // Push chunks into the readable stream when received
                case StreamMessageType.Chunk: {
                    const { data: chunk, id } = data as StreamChunkMessageBody;
                    if (id === this.#id) this.push(chunk);
                    break;
                }
                case StreamMessageType.End: {
                    const { id } = data as StreamEndMessageBody;
                    // Only end the stream if the ID for the stream being ended
                    // is equal to the one we initialized with.
                    if (id !== this.#id) break;

                    this.push(null);
                    // Clean up the listener, as it is no longer needed
                    // since the stream has ended, as confirmed by the
                    // sender.
                    this.#sender.off('message', handler);
                    this.destroy();
                    break;
                }
                default:
                    break;
            }
        };

        this.#sender.on('message', handler);

        this.#registered = true;
    }
}
