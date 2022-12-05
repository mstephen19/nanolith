import type { StreamMessageType } from './streams.js';

export const enum MessengerMessageType {
    Message = 'message',
    Close = 'close',
}

export type MessengerBaseMessageBody<Type = MessengerMessageType | StreamMessageType> = {
    type: Type;
};

export type MessengerMessageBody = {
    sender: string;
    data: any;
} & MessengerBaseMessageBody<MessengerMessageType.Message>;

export type MessengerCloseMessageBody = MessengerBaseMessageBody<MessengerMessageType.Close>;

export type MessengerTransferData = Readonly<{
    /**
     * The unique identifier for the set of {@link BroadcastChannel}s
     * the `Messenger` instances are tuned into.
     */
    __messengerID: string;
}>;
