export type MessengerMessageBody = {
    sender: string;
    data: any;
};

export type MessengerTransferData = Readonly<{
    __messengerID: string;
}>;
