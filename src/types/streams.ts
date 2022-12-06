import type { ReadableFromPort } from '../streams/index.js';
import type { Awaitable } from './utilities.js';

export type OnStreamCallback<Sender extends Messagable> = (stream: ReadableFromPort<Sender>) => Awaitable<void>;

export type AcceptStreamFunction<Sender extends Messagable> = () => ReadableFromPort<Sender>;
export type DeclineStreamFunction = () => void;

export type ConfirmStreamCallback<Sender extends Messagable> = (data: {
    metaData: Record<any, any>;
    accept: AcceptStreamFunction<Sender>;
}) => Awaitable<void>;

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

export const enum ListenForStreamMode {
    AcceptAll,
    ConfirmFirst,
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
