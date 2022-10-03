import type { MessengerTransferData } from '../types/messenger.js';

export const isMessengerTransferObject = (data: MessengerTransferData): data is MessengerTransferData => {
    const hasValidMessengerID = !!data?.__messengerID && typeof data?.__messengerID === 'string';
    const hasValidPorts = !!data?.__ports && Array.isArray(data?.__ports) && data?.__ports?.every((item) => item instanceof MessagePort);
    return hasValidMessengerID && hasValidPorts;
};
