import { ReadableFromPort } from './readable_from_port.js';
import { StreamMessageType, ListenForStreamMode } from '@typing/streams.js';

import type { Messagable, StreamReadyMessageBody, StreamStartMessageBody } from '@typing/streams.js';
import type { OnStreamCallback, ConfirmStreamCallback } from '@typing/streams.js';

export function listenForStream<Sender extends Messagable>(
    sender: Sender,
    callback: ConfirmStreamCallback<Sender>,
    mode: ListenForStreamMode.ConfirmFirst
): void;
export function listenForStream<Sender extends Messagable>(
    sender: Sender,
    callback: OnStreamCallback<Sender>,
    mode?: ListenForStreamMode.AcceptAll
): void;
/**
 * Ensure the current port is ready to start receiving data before notifying the sender.
 */
export function listenForStream<Sender extends Messagable>(
    sender: Sender,
    callback: OnStreamCallback<Sender> | ConfirmStreamCallback<Sender>,
    mode: ListenForStreamMode = ListenForStreamMode.AcceptAll
) {
    sender.on('message', async (data: StreamStartMessageBody) => {
        if (data.type !== StreamMessageType.Start) return;

        const createStream = () => {
            // Prepare the stream
            const stream = new ReadableFromPort(data.id, sender, data.meta ?? {});

            // Let the sender know that it can start writing data
            const body: StreamReadyMessageBody = {
                type: StreamMessageType.Ready,
                id: data.id,
            };
            sender.postMessage(body);

            return stream;
        };

        if (mode === ListenForStreamMode.AcceptAll) {
            // Finally, once the data is flowing, run the provided callback with the
            // expected stream instance passed in
            await (callback as OnStreamCallback<Sender>)(createStream());
            return;
        }

        if (mode === ListenForStreamMode.ConfirmFirst) {
            await (callback as ConfirmStreamCallback<Sender>)({ metaData: data.meta, accept: () => createStream() });
        }
    });
}
