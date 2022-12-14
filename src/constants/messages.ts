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
    /**
     * To be used when a service worker throws an exception and the main
     * thread must be notified about it.
     */
    WorkerException,
    /**
     * To be used to notify the main thread that a service worker has
     * completed initialization and that it's ready to go.
     */
    Initialized,
}
