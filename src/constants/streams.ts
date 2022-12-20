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
