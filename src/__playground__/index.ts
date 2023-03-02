import { SharedMap } from '@shared_map';

const map = new SharedMap({ a: 1, b: 2, c: 3, d: 4 });

const entries: string[] = [];

for await (const entry of map.entries()) {
    entries.push(entry);
}

console.log(entries);
