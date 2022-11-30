import type { MessengerTransferData } from '../types/messenger.js';

export const isMessengerTransferObject = (data: MessengerTransferData): data is MessengerTransferData => {
    return !!data?.__messengerID && typeof data?.__messengerID === 'string';
};
