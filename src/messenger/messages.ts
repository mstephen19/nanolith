import { workerData } from 'worker_threads';
import { parent } from '../service/index.js';

import type { BaseWorkerData } from '../types/worker_data.js';
import { Messenger } from './messenger.js';

async function use(name: string) {
    const { messengers } = workerData as BaseWorkerData;

    const messenger = !messengers[name]
        ? ((await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                  reject(new Error(`Timed out after waiting 10 seconds to receive a messenger named ${name}`));
              }, 10e3);

              parent.onMessengerReceived((messenger) => {
                  if (messenger.ID !== name) return;
                  resolve(messenger);
                  clearTimeout(timeout);
              });
          })) as Messenger)
        : messengers[name];

    return messenger;
}

export const messages = { use };
