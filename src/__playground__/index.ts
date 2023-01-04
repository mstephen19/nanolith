import { SharedMap } from 'nanolith';

const myMap = new SharedMap({ foo: 'bar' });
// Create a "watch" object for the key "foo".
const foo = await myMap.watch('foo');

// Every second, check for changes to the value under
// the key "foo" using the watch object.
const interval = setInterval(() => {
    // If the watched value has changed since its
    // .current() value was last accessed, .changed()
    // will return "true".
    if (!foo.changed()) return;
    // Log out the new changed value.
    console.log(foo.current());
    clearInterval(interval);
    myMap.close();
}, 1000);

// Change the value of foo
await myMap.set('foo', 'hello world');