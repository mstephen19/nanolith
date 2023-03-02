import { SharedMap } from '@shared_map';

const map = new SharedMap({ a: undefined });

console.log(await map.get('a'));
