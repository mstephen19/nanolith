import type { MainThreadMessageType, WorkerMessageType } from '@constants/messages.js';
import type { MessengerTransferData } from './messenger.js';

export type RemoveListenerFunction = () => void;

export type MainThreadBaseMessageBody<Type extends MainThreadMessageType = MainThreadMessageType> = {
    type: Type;
};

export type MainThreadSendMessageBody<Data = any> = {
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

export type WorkerBaseMessageBody<Type extends WorkerMessageType = WorkerMessageType> = {
    type: Type;
};

export type WorkerSendMessageBody<Data = any> = {
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

export type WorkerExceptionMessageBody = {
    data: Error;
} & WorkerBaseMessageBody<WorkerMessageType.WorkerException>;

export type WorkerInitializedMessageBody = WorkerBaseMessageBody<WorkerMessageType.Initialized>;
