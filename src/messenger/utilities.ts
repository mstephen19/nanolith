import type { MessengerRawData } from '@typing/messenger.js';

export const isRawMessengerObject = (data: MessengerRawData): data is MessengerRawData => {
    return !!data?.__messengerID && typeof data?.__messengerID === 'string';
};
