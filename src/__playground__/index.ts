import { Messenger } from '../index.js';
import { api } from './worker.js';

const messenger = new Messenger('channel');

const service = await api.launchService({
    messengers: [messenger],
});
