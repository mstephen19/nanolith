// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SharedArrayPair<Data = Record<string, any>> = {
    keys: Uint8Array;
    values: Uint8Array;
};

export type KeyData = {
    name: string;
    start: number;
    end: number;
};

export type Key = `${string}(${number},${number});`;