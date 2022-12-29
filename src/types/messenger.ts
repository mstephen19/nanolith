import type { Messenger } from '@messenger';
import type { MessengerMessageType } from '@constants/messenger.js';

export type MessengerBaseMessageBody<Type = MessengerMessageType> = {
    type: Type;
    sender: string;
};

export type MessengerMessageBody = {
    data: any;
} & MessengerBaseMessageBody<MessengerMessageType.Message>;

export type MessengerCloseMessageBody = MessengerBaseMessageBody<MessengerMessageType.Close>;

export type MessengerStreamMessageBody = {
    data: any;
} & MessengerBaseMessageBody<MessengerMessageType.StreamMessage>;

export type MessengerTransferData = Readonly<{
    /**
     * The unique identifier for the set of {@link BroadcastChannel}s
     * the `Messenger` instances are tuned into.
     */
    __messengerID: string;
}>;

export type MessengerList = {
    /**
     * For use only within workers.
     *
     * @param name The name of the `Messenger` to use.
     * @returns A promise of a {@link Messenger} instance that can be used to send messages between threads.
     *
     * This function will throw an error if a `Messenger` instance with the specified name was never sent to the worker.
     *
     * @example
     * const messenger = await MessengerList.use('foo');
     *
     * messenger.onMessage<string>((data) => console.log(data, 'received!'));
     */
    use: (name: string) => Promise<Messenger>;
    /**
     * Grab hold of an object containing all `Messenger`s available within the current worker.
     *
     * **Tip:** Useful when debugging issues involving `Messenger`s.
     *
     * @returns An object containing `Messenger`s organized based on their names.
     *
     * @example
     * const map = MessengerList.list;
     * console.log(map); // -> { foo: Messenger, bar: Messenger }
     * console.log(map.foo.uniqueKey);
     */
    list: Record<string, Messenger>;
};
