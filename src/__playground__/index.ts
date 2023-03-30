import { Messenger } from '@messenger';

const m1 = new Messenger();
const m2 = new Messenger(m1.raw);

m1.closeAll();

await new Promise((r) => setTimeout(r, 5e3));

console.log(m2.closed, m1.closed);
