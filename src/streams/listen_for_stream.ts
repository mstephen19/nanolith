import { ReadableFromPort } from './readable_from_port.js';
import { StreamMessageType } from '../types/streams.js';

import type { Messagable, StreamReadyMessageBody, StreamStartMessageBody } from '../types/streams.js';
import type { OnStreamCallback } from '../types/streams.js';

/**
 * Ensure the current port is ready to start receiving data before notifying the sender.
 */
//  ! Accept a third parameter that allows for intercepting the Start message and either "accept"ing or "decline"ing the stream
export function listenForStream<Sender extends Messagable>(sender: Sender, callback: OnStreamCallback<Sender>) {
    sender.on('message', async (data: StreamStartMessageBody) => {
        if (data.type !== StreamMessageType.Start) return;

        // Prepare the stream
        const stream = new ReadableFromPort(data.id, sender, data.meta ?? {});

        // Let the sender know that it can start writing data
        const body: StreamReadyMessageBody = {
            type: StreamMessageType.Ready,
            id: data.id,
        };
        sender.postMessage(body);

        // Finally, once the data is flowing, run the provided callback with the
        // expected stream instance passed in
        await callback(stream);
    });
}
