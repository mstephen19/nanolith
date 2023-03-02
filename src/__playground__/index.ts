import { SharedMap } from '@shared_map';

const map = new SharedMap({ a: 'a' });

// @ts-ignore
await map.set('a', undefined);

console.log(await map.get('a'));
