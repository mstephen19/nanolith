import { SharedMap } from 'nanolith';

const myMap = new SharedMap({ foo: 'bar' });
const { current, changed, stopWatching } = await myMap.watch('foo');
