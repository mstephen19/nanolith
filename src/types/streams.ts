// import type { TransferListItem } from 'worker_threads';

export interface Messagable {
    on(event: 'message', callback: (value: any) => void): any;
    off(event: 'message', callback: (value: any) => void): any;
    postMessage(value: any): void;
}

export const enum StreamMessageType {
    Ready = 'stream-ready-to-consume',
    Start = 'stream-start',
    End = 'stream-finished',
    Chunk = 'stream-chunk',
}

export type StreamBaseMessageBody<Type = StreamMessageType> = {
    type: Type;
};

export type StreamStartMessageBody<MetaData = Record<any, any>> = {
    id: string;
    meta: MetaData;
} & StreamBaseMessageBody<StreamMessageType.Start>;

export type StreamReadyMessageBody = { id: string } & StreamBaseMessageBody<StreamMessageType.Ready>;

export type StreamChunkMessageBody = {
    id: string;
    data: Buffer;
} & StreamBaseMessageBody<StreamMessageType.Chunk>;

export type StreamEndMessageBody = { id: string } & StreamBaseMessageBody<StreamMessageType.End>;
