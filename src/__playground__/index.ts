import { SharedMap } from '@nanolith';

const map = new SharedMap<Record<string, string>>({ foo: 'bar' });

console.log(new TextDecoder().decode(map.transfer.__keys));
console.log(new TextDecoder().decode(map.transfer.__values));

await map.set('xyz', 'hello');
console.log('-'.repeat(10));
console.log(new TextDecoder().decode(map.transfer.__keys));
console.log(new TextDecoder().decode(map.transfer.__values));

console.log(await map.get('xyz'));
