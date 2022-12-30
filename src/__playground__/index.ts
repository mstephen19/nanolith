import { SharedMap } from '@shared_map';

const map = new SharedMap({ foo: 'bar' });

const data = await map.watch('foo');

// bar
console.log(data.current);

await map.set('foo', 'baz');

await new Promise((r) => setTimeout(r, 2e3));

// baz
console.log(data.current);

map.close();
data.stopWatching();
