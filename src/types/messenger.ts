import type { MessagePort } from 'worker_threads';

export type MessengerMessageBody = {
    sender: string;
    data: any;
};

export type MessengerTransferData = Readonly<{
    __ports: MessagePort[];
    __messengerID: string;
}>;
