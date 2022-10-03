import { MessengerTransferData } from './messenger.js';

/**
 * Message types that will only be sent from the main thread
 * to workers, and never the other way around.
 */
export const enum MainThreadMessageType {
    /**
     * To be used when sending a message to a worker from
     * the main thread.
     */
    Message,
    /**
     * To be used when calling a task in a service worker.
     */
    Call,
    /**
     * To be used when posting a message to a service worker
     * notifying it to exit its process immediately.
     */
    Terminate,
    /**
     * To be used when passing `Messenger` objects to workers.
     */
    MessengerTransfer,
}

export type MainThreadBaseMessageBody<Type extends MainThreadMessageType = MainThreadMessageType> = {
    type: Type;
};

export type MainThreadSendMessageBody<Data extends any> = {
    data: Data;
} & MainThreadBaseMessageBody<MainThreadMessageType.Message>;

export type MainThreadCallMessageBody = {
    key: string;
    name: string;
    params: any[];
} & MainThreadBaseMessageBody<MainThreadMessageType.Call>;

export type MainThreadTerminateMessageBody = MainThreadBaseMessageBody<MainThreadMessageType.Terminate>;

export type MainThreadMessengerTransferBody = {
    data: MessengerTransferData;
} & MainThreadBaseMessageBody<MainThreadMessageType.MessengerTransfer>;

/**
 * Message types that will only be sent from workers over to
 * the main thread, and never the other way around.
 */
export const enum WorkerMessageType {
    /**
     * To be used when sending a message from a worker to
     * the main thread.
     */
    Message,
    /**
     * To be used when a task worker has returned a
     * value and posting it back to the main thread.
     */
    TaskReturn,
    /**
     * To be used when a task worker has failed and
     * an error has been thrown.
     */
    TaskError,
    /**
     * To be used when a called task in a service worker has
     * returned a value and posting it back to the main thread.
     */
    CallReturn,
    /**
     * To be used when a called task in a service worker has
     * failed and posting the error back to the main thread.
     */
    CallError,
    /**
     * To be used when notifying the main thread that a `Messenger`
     * object has successfully been sent.
     */
    MessengerTransferSuccess,
}

export type WorkerBaseMessageBody<Type extends WorkerMessageType = WorkerMessageType> = {
    type: Type;
};

export type WorkerSendMessageBody<Data extends any> = {
    data: Data;
} & WorkerBaseMessageBody<WorkerMessageType.Message>;

export type WorkerTaskReturnMessageBody = {
    data: any;
} & WorkerBaseMessageBody<WorkerMessageType.TaskReturn>;

export type WorkerTaskErrorMessageBody = {
    data: Error;
} & WorkerBaseMessageBody<WorkerMessageType.TaskError>;

export type WorkerCallReturnMessageBody = {
    key: string;
    data: any;
} & WorkerBaseMessageBody<WorkerMessageType.CallReturn>;

export type WorkerCallErrorMessageBody = {
    key: string;
    data: Error;
} & WorkerBaseMessageBody<WorkerMessageType.CallError>;

export type WorkerMessengerTransferSuccessBody = {
    data: string;
} & WorkerBaseMessageBody<WorkerMessageType.MessengerTransferSuccess>;
