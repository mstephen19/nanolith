import { randomUUID as v4 } from 'crypto';
import { WritableToPort } from './writable_to_port.js';
import { StreamMessageType } from '../types/streams.js';

import type { Messagable, StreamReadyMessageBody, StreamStartMessageBody } from '../types/streams.js';

export function prepareWritableToPortStream<Target extends Messagable>(target: Target, metaData: Record<any, any>) {
    const id = v4();

    return new Promise((resolve) => {
        // When the target notifies that it is ready to start receiving
        // chunks, resolve with a new WritableToPort instance
        const readyHandler = (data: StreamReadyMessageBody) => {
            if (data.type !== StreamMessageType.Ready) return;
            if (data.id !== id) return;

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
