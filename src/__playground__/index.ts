import { SharedMap } from '@shared_map';

const map = new SharedMap({ a: 1, b: 2, c: 3 });

const entries: string[] = [];

for await (const [_, value] of map.entries()) {
    entries.push(value!);
}

console.log(entries);
