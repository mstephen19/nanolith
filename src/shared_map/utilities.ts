import type { SharedMapTransferData } from '@typing/shared_map.js';

export const createSharedArrayBuffer = (size: number) => {
    return new Uint8Array(new SharedArrayBuffer(size));
};

export const encodeValue = (encoder: TextEncoder, data: any) => {
    return encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
};

export const isSharedMapTransferData = (pair: any): pair is SharedMapTransferData => {
    const hasKeys = '__keys' in pair && pair?.__keys instanceof Uint8Array;
    const hasValues = '__values' in pair && pair?.__values instanceof Uint8Array;
    const hasStatus = '__identifier' in pair && typeof pair?.__identifier === 'string';
    return hasKeys && hasValues && hasStatus;
};

export const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
