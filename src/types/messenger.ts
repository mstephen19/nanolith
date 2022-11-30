export type MessengerMessageBody = {
    sender: string;
    data: any;
};

export type MessengerCloseMessageBody = {
    close: true;
};

export type MessengerTransferData = Readonly<{
    __messengerID: string;
}>;
