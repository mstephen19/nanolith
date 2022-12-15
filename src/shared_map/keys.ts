import type { KeyData, Key } from '../types/shared_map.js';

export const createKey = ({ name, start, end }: KeyData): Key => `${name}(${start},${end});`;

export const parseKey = (key: Key): KeyData => {
    const [start, end] = key.match(/(?<=\()\d+|\d+(?=\))/g)!;
    const name = key.match(/.*(?=\(\d+,\d+\);)/g)![0];

    return {
        name,
        start: +start,
        end: +end,
    };
};

export const createKeyRegex = (name: string) => new RegExp(`${name}\\(\\d+,\\d+\\);`, 'g');

export const matchKey = (decodedKeys: string, name: string): Key | null => {
    return decodedKeys.match(createKeyRegex(name))?.[0] as Key;
};
