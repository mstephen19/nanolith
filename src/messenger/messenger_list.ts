/* eslint-disable indent */
import { workerData } from 'worker_threads';
import { ParentThread } from '@service';
import { assertIsNotMainThread } from '@utilities';

import type { Messenger } from './messenger.js';
import type { BaseWorkerData } from '@typing/worker_data.js';
import type { MessengerList as MessengerListType } from '@typing/messenger.js';

async function use(name: string) {
    assertIsNotMainThread('MessengerList.use');
    const { messengers } = workerData as BaseWorkerData;

    const messenger = messengers[name]
        ? messengers[name]
        : ((await new Promise((resolve, reject) => {
              const timeout = setTimeout(
                  reject.bind(undefined, new Error(`Timed out after waiting 10 seconds to receive a messenger named ${name}`)),
                  10e3
              );

              const removeListener = ParentThread.onMessengerReceived((messenger: Messenger) => {
                  if (messenger.ID !== name) return;
                  resolve(messenger);
                  clearTimeout(timeout);
                  removeListener();
              });
          })) as Messenger);

    return messenger;
}

function list() {
    assertIsNotMainThread('MessengerList.list');
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
export const MessengerList: MessengerListType = Object.create(
    {
        use,
    },
    {
        list: {
            get() {
                return list();
            },
        },
    }
);
