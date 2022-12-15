import { SharedMap } from '../index.js';

const map = new SharedMap({ foo: '10000000', fizz: 'x', buzz: 'y' });

console.log(new TextDecoder().decode(map.pair.keys));
console.log(new TextDecoder().decode(map.pair.values));

console.log(map.get('foo'));
console.log(map.get('fizz'));
console.log(map.get('buzz'));

map.set('foo', 'HEYOOOOOOOOOOOOOOOOOOOOOOOOOO');
// map.set('fizz', 3);
// map.set('buzz', 4);

console.log(new TextDecoder().decode(map.pair.keys));
console.log(new TextDecoder().decode(map.pair.values));

map.set('foo', 'H');

console.log(new TextDecoder().decode(map.pair.keys));
console.log(new TextDecoder().decode(map.pair.values));

console.log(map.get('foo'));
console.log(map.get('fizz'));
console.log(map.get('buzz'));

// console.log(map.get('foo'));
// console.log(map.get('fizz'));
// console.log(map.get('buzz'));
