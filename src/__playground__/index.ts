import { SharedMap } from '../index.js';

const map = new SharedMap({ foo: 'this is foo', fizz: 'this is fizz', buzz: 'this is buzz' });

map.set('foo', 'a');
map.set('fizz', 'b');
map.set('buzz', 'c');

console.log(map.get('foo'));
console.log(map.get('fizz'));
console.log(map.get('buzz'));
