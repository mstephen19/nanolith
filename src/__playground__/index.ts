import { worker } from './worker.js';

await worker({ name: 'wait', reffed: false, shareEnv: false });
