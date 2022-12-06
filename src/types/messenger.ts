export const enum MessengerMessageType {
    Message = 'message',
    Close = 'close',
    StreamMessage = 'stream-message',
}

export type MessengerBaseMessageBody<Type = MessengerMessageType> = {
    type: Type;
    sender: string;
};

export type MessengerMessageBody = {
    data: any;
} & MessengerBaseMessageBody<MessengerMessageType.Message>;

export type MessengerCloseMessageBody = MessengerBaseMessageBody<MessengerMessageType.Close>;

export type MessengerStreamMessageBody = {
    data: any;
} & MessengerBaseMessageBody<MessengerMessageType.StreamMessage>;

export type MessengerTransferData = Readonly<{
    /**
     * The unique identifier for the set of {@link BroadcastChannel}s
     * the `Messenger` instances are tuned into.
     */
    __messengerID: string;
}>;
