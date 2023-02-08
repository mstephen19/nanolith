import { SharedMap } from '@shared_map';

const map = new SharedMap({ foo: 'bar', test: 123 });

await map.delete('foo');

console.log(await map.get('foo'));

// @ts-ignore
console.log(await map.get('xyz'));
