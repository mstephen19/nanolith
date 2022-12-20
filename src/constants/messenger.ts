/**
 * The different values that can be used in a message body's
 * `type` property.
 */
export const enum MessengerMessageType {
    /**
     * User-sent/received message
     */
    Message = 'message',
    /**
     * Notification sent to all messenger instances when the
     * `close()` method is called.
     */
    Close = 'close',
    /**
     * Stream data to be inter-oped.
     */
    StreamMessage = 'stream-message',
}
