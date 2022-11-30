import { Messenger } from '../index.js';
import { api } from './worker.js';

const m1 = new Messenger('foo');
const m2 = new Messenger(m1.transfer());

m2.onMessage<string>((data) => {
    console.log(data);
});

m1.sendMessage('foo');

await new Promise((resolve) => setTimeout(resolve, 5e3));

// await api({ name: 'seek' });
