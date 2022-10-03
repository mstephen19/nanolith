import type { MessengerTransferData } from '../types/messenger.js';

export const isMessengerTransferObject = (data: MessengerTransferData): data is MessengerTransferData => {
    const hasValidMessengerID = !!data?.__messengerID && typeof data?.__messengerID === 'string';
    return hasValidMessengerID;
};
