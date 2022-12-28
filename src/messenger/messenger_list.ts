/* eslint-disable indent */
import { workerData } from 'worker_threads';
import { MainThread } from '@service';
import { assertIsNotMainThread } from '@utilities';

import type { Messenger } from './messenger.js';
import type { BaseWorkerData } from '@typing/worker_data.js';

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
async function use(name: string) {
    assertIsNotMainThread('MessengerList.use');
    const { messengers } = workerData as BaseWorkerData;

    const messenger = messengers[name]
        ? messengers[name]
        : ((await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                  reject(new Error(`Timed out after waiting 10 seconds to receive a messenger named ${name}`));
              }, 10e3);

              const removeListener = MainThread.onMessengerReceived((messenger: Messenger) => {
                  if (messenger.ID !== name) return;
                  resolve(messenger);
                  clearTimeout(timeout);
                  removeListener();
              });
          })) as Messenger);

    return messenger;
}

/**
 * Grab hold of an object containing all `Messenger`s available within the current worker.
 *
 * **Tip:** Useful when debugging issues involving `Messenger`s.
 *
 * @returns An object containing `Messenger`s organized based on their names.
 *
 * @example
 * const map = MessengerList.seek();
 * console.log(map); // -> { foo: Messenger, bar: Messenger }
 * console.log(map.foo.uniqueKey);
 */
function list() {
    assertIsNotMainThread('MessengerList.seek');
    return (workerData as BaseWorkerData).messengers;
}

/**
 * An object containing functions to be used within workers when interacting with {@link Messenger}s.
 *
 * @example
 * const messenger = await MessengerList.use('foo');
 *
 * messenger.onMessage<string>((data) => console.log(data, 'received!'));
 */
export const MessengerList = {
    list,
    use,
};
