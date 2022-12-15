export const createSharedArrayBuffer = (size: number) => {
    return new Uint8Array(new SharedArrayBuffer(size));
};

export const encodeValue = (encoder: TextEncoder, data: any) => {
    return encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
};
