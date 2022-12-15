import { SharedMap } from '../index.js';

const map = new SharedMap({ foo: 'this is foo', fizz: 'this is fizz', buzz: 'this is buzz' });

const map2 = new SharedMap(map.pair);
