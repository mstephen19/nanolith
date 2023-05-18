/**
 * Cross-thread streams communicate using a few different message types.
 */
export const enum StreamMessageType {
    Ready = 'stream-ready-to-consume',
    Start = 'stream-start',
    End = 'stream-finished',
    Chunk = 'stream-chunk',
}

/**
 * Two modes available. Either accept all incoming streams,
 * or require some confirmation first.
 */
export const enum ListenForStreamMode {
    AcceptAll,
    ConfirmFirst,
}
