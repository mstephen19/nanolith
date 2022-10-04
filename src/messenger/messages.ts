/* eslint-disable indent */
import { workerData } from 'worker_threads';
import { parent } from '../service/index.js';

import type { Messenger } from './messenger.js';
import type { BaseWorkerData } from '../types/worker_data.js';

async function use(name: string) {
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

export const messages = { use };
