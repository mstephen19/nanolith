import { Messenger } from '../index.js';
import { api } from './worker.js';

const service = await api.launchService();

const result = await service.waitForMessage<string>((data) => data === 'foo');

console.log('success', result);
