import { SharedMap } from '@nanolith';
import api from './worker.js';

// Create some shared memory space based on an object.
const map = new SharedMap({ foo: 'bar' });

await map.set('foo', 'fizz buzz');

// This can be expected to console log "fizz buzz", then set the
// new value of foo to equal the string "set in the worker".
await api({ name: 'myHandler', params: [map.transfer] });

console.log(await map.get('foo')); // -> set in the worker

// Closes the underlying BroadcastChannel associated with
// the instance, allowing the process to exit.
map.close();
