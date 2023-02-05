import type { ParentThreadMessageType, WorkerMessageType } from '@constants/messages.js';
import type { MessengerRawData } from './messenger.js';

export type RemoveListenerFunction = () => void;

export type ParentThreadBaseMessageBody<Type extends ParentThreadMessageType = ParentThreadMessageType> = {
    type: Type;
};

export type ParentThreadSendMessageBody<Data = any> = {
    data: Data;
} & ParentThreadBaseMessageBody<ParentThreadMessageType.Message>;

export type ParentThreadCallMessageBody = {
    key: string;
    name: string;
    params: any[];
} & ParentThreadBaseMessageBody<ParentThreadMessageType.Call>;

export type ParentThreadTerminateMessageBody = ParentThreadBaseMessageBody<ParentThreadMessageType.Terminate>;

export type ParentThreadMessengerTransferBody = {
    data: MessengerRawData;
} & ParentThreadBaseMessageBody<ParentThreadMessageType.MessengerTransfer>;

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
