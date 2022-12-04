import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { define, parent } from '../index.js';

export const api = await define({
    __initializeService() {
        parent.onStream((stream) => {
            stream.on('data', (data) => {
                console.log(Buffer.from(data).toString('utf-8'));
            });
        });
    },
    sendStream() {
        class DataEmitter extends EventEmitter {
            constructor() {
                super();

                const data = ['foo', 'bar', 'baz', 'hello', 'world', 'abc', '123'];
                // Every second, emit an event with a chunk of data
                const interval = setInterval(() => {
                    this.emit('chunk', data.splice(0, 1)[0]);

                    // Once there are no more items, emit an event
                    // notifying that that is the case
                    if (!data.length) {
                        this.emit('done');
                        clearInterval(interval);
                    }
                }, 1e3);
            }
        }

        class MyReadable extends Readable {
            // Keep track of whether or not the listeners have already
            // been added to the data emitter.
            #registered = false;

            _read() {
                // If the listeners have already been registered, do
                // absolutely nothing.
                if (this.#registered) return;

                // "Notify" the client via websockets that we're ready
                // to start streaming the data chunks.
                const emitter = new DataEmitter();

                const handler = (chunk: string) => {
                    this.push(chunk);
                };

                emitter.on('chunk', handler);

                emitter.once('done', () => {
                    this.push(null);
                    // Clean up the listener once it's done (this is
                    // assuming the #emitter object will still be used
                    // in the future).
                    emitter.off('chunk', handler);
                });

                // Mark the listeners as registered.
                this.#registered = true;
            }
        }

        const stream = new MyReadable();
        stream.pipe(parent.createStream({ name: 'foo' }));
    },
});
