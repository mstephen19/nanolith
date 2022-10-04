/* eslint-disable indent */
import { workerData } from 'worker_threads';
import { parent } from '../service/index.js';
import { assertIsNotMainThread } from '../utilities/index.js';

import type { Messenger } from './messenger.js';
import type { BaseWorkerData } from '../types/worker_data.js';

/**
 * For use only within workers.
 *
 * @param name The name of the `Messenger` to use.
 * @returns A promise of a {@link Messenger} instance that can be used to send messages between threads.
 *
 * This function will throw an error if a `Messenger` instance with the specified name was never sent to the worker.
 *
 * @example
 * const messenger = await messages.use('foo');
 *
 * messenger.onMessage<string>((data) => console.log(data, 'received!'));
 */
async function use(name: string) {
    assertIsNotMainThread('messages.use');

    const { messengers } = workerData as BaseWorkerData;

    const messenger = !messengers[name]
        ? ((await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                  reject(new Error(`Timed out after waiting 10 seconds to receive a messenger named ${name}`));
              }, 10e3);

              const callback = (messenger: Messenger) => {
                  if (messenger.ID !== name) return;
                  resolve(messenger);
                  clearTimeout(timeout);
                  parent.offMessage(callback);
              };

              parent.onMessengerReceived(callback);
          })) as Messenger)
        : messengers[name];

    return messenger;
}

/**
 *
 * An object containing functions to be used within workers when interacting with {@link Messenger}s.
 *
 * @example
 * const messenger = await messages.use('foo');
 *
 * messenger.onMessage<string>((data) => console.log(data, 'received!'));
 */
export const messages = Object.freeze({ use });
