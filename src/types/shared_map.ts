// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SharedMapTransferData<Data = Record<string, any>> = {
    keys: Uint8Array;
    values: Uint8Array;
    status: Uint8Array;
};

export type KeyData = {
    name: string;
    start: number;
    end: number;
};

export type Key = `${string}(${number},${number});`;

export const enum BusyStatus {
    Free = 0,
    Busy = 1,
}
