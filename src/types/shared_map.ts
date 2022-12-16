// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SharedMapTransferData<Data = Record<string, any>> = {
    __keys: Uint8Array;
    __values: Uint8Array;
    __status: Uint8Array;
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
