import { SharedMap } from '../index.js';

const map = new SharedMap({ foo: 'xyz', fizz: 'y', buzz: 'z' });

await map.set('foo', 'a');
await map.set('fizz', 'b');
await map.set('buzz', 'c');

console.log(await map.get('foo'));
console.log(await map.get('fizz'));
console.log(await map.get('buzz'));
