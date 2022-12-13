import { randomUUID as v4 } from 'crypto';
import { WritableToPort } from './writable_to_port.js';
import { StreamMessageType } from '../types/streams.js';

import type { Messagable, StreamReadyMessageBody, StreamStartMessageBody } from '../types/streams.js';

/**
 * Ensure the other thread is ready to start receiving data before resolving with a Writable stream.
 */
export function prepareWritableToPortStream<Target extends Messagable>(target: Target, metaData: Record<any, any>, timeoutSecs = 15e3) {
    const id = v4();

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(
            () =>
                reject(
                    new Error(
                        'Stream creation failed after 15 seconds. Receiver failed to notify of its ready status. If you are using the Messenger API, make sure you are using the ".onStream()" listener on one of the receiving ends and that at least one receiver is accepting the stream with the "accept()" function.'
                    )
                ),
            timeoutSecs
        );

        // When the target notifies that it is ready to start receiving
        // chunks, resolve with a new WritableToPort instance
        const readyHandler = (data: StreamReadyMessageBody) => {
            if (data.type !== StreamMessageType.Ready) return;
            if (data.id !== id) return;
            clearTimeout(timeout);

            resolve(new WritableToPort(target, id, metaData));

            // Clean up the listener, effectively acting as a .once
            target.off('message', readyHandler);
        };
        target.on('message', readyHandler);

        // Notify the target that a new stream is starting with the generated
        // ID and user-provided metadata. Triggers the "Ready" message.
        const body: StreamStartMessageBody = {
            type: StreamMessageType.Start,
            id,
            meta: metaData,
        };
        target.postMessage(body);
    }) as Promise<WritableToPort<Target>>;
}
