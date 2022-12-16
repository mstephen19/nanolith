import { threadId } from 'worker_threads';
import { define, messengers } from '../index.js';

export const api = await define({
    handleSharedMap() {},
});
