import { SharedMap } from 'nanolith';

const map = new SharedMap<Record<string, unknown>>({});

await map.set('name', 'avery');

console.log(await map.get('name'));

map.close();
