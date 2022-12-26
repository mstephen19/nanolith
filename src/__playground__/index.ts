import api from './worker.js';
import { SharedMap } from '@nanolith';

const map = new SharedMap<Record<string, string>>({ foo: 'bar' });

await api({ name: 'handler', params: [map.transfer] });

console.log(await map.get('fuck'));

map.close();
