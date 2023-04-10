/**
 * Message types that will only be sent from the parent thread
 * to workers, and never the other way around.
 */
export const enum ParentThreadMessageType {
    /**
     * When sending a message to a worker from the main thread.
     */
    Message,
    /**
     * When calling a task in a service worker.
     */
    Call,
    /**
     * When posting a message to a service worker
     * notifying it to exit its process immediately.
     */
    Terminate,
    /**
     * When passing `Messenger` objects to workers.
     */
    MessengerTransfer,
}

/**
 * Message types that will only be sent from workers over to
 * the parent thread, and never the other way around.
 */
export const enum WorkerMessageType {
    /**
     * When sending a message from a worker to
     * the parent thread.
     */
    Message,
    /**
     * When a task worker has returned a
     * value and posting it back to the parent thread.
     */
    TaskReturn,
    /**
     * When a task worker has failed and
     * an error has been thrown.
     */
    TaskError,
    /**
     * When a called task in a service worker has
     * returned a value and posting it back to the parent thread.
     */
    CallReturn,
    /**
     * When a called task in a service worker has
     * failed and posting the error back to the parent thread.
     */
    CallError,
    /**
     * When notifying the parent thread that a `Messenger`
     * object has successfully been sent.
     */
    MessengerTransferSuccess,
    /**
     * When a service worker throws an exception and the parent
     * thread must be notified about it.
     */
    WorkerException,
    /**
     * To notify the parent thread that a service worker has
     * completed initialization and that it's ready to go.
     */
    Initialized,
    /**
     * For sending messages to the main thread notifying that a service has exited.
     */
    Exit,
}
