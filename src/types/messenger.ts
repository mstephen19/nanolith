export type MessengerMessageBody = {
    sender: string;
    data: any;
};

export type MessengerCloseMessageBody = {
    close: true;
};

export type MessengerTransferData = Readonly<{
    /**
     * The unique identifier for the set of {@link BroadcastChannel}s
     * the `Messenger` instances are tuned into.
     */
    __messengerID: string;
}>;
