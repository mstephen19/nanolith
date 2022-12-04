import { api } from './worker.js';

const service = await api.launchService();

service.sendMessage({ type: 'init_stream', id: '123' });

service.sendMessage({ type: 'stream_data-123', data: Buffer.from('hello '), done: false });
service.sendMessage({ type: 'stream_data-123', data: Buffer.from('world'), done: true });

// await service.close();
