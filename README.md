# Nanolith

Nanoservices in no time.

<img src="https://i.imgur.com/78hdJKo.png" alt="Nanolith logo" width="400">

> **Note:** This project is still in beta. Because of this, the README documentation is not yet extensive.

## About

[Threadz](https://github.com/mstephen19/threadz) gets the job done, but after getting various feedback on its APIs, I realized that it is overly complex. You have the `Threadz` API for running one-off tasks within short-term workers, the `Interact` API for running one-off tasks, but sending messages to them, the `BackgroundThreadzWorker` API for running workers that are long-running services, the `Communicate` API for communicating between workers, etc. Each of these APIs has their own methods that need to be learned by reading the documentation. Additionally, the configuration of workers was placed poorly, and did not allow for flexibility. Overall, Threadz has turned into a hot coupled mess.

So how's **Nanolith** any different? Other than being more performant and more reliable, Nanolith has just two APIs. The **Nanolith** API can be used to call one-off workers, and directly on the API the `launchService()` function can be called to launch a long-running worker that has access to your function definitions that will only finish once it's been told to `terminate()`. When you launch a service, you are immediately able to communicate back and forth between the worker and the main thread with no other APIs needed.

Enough talk though, let's look at how this thing works.

## Table of Contents

- [Define a set of tasks](#define-a-set-of-tasks)
- [Run a task](#run-a-task)
- [Launch a service](#launch-a-service)
- [Communicate between threads](#communicate-between-threads)

## Define a set of tasks

<!-- todo: Go over the define function -->

## Run a task

<!-- todo: Go over using the task interface -->

## Launch a service

<!-- todo: Go over using launchService and the Service API -->

## Communicate between threads

<!-- todo: Go over the two ways of communicating: between main thread and worker on Service, or with Messenger -->

## Examples

One of the biggest changes is how workers are created, and where they are run. In Threadz, the "workerfile" lives within the library's files; however, **Nanolith** does things differently. When you use the `define` function (which does not need to be the default export), you have access to the **Nanolith** API on the main thread. On other threads, the function runs a worker script.

## Basic example

```TypeScript
// worker.ts
import { define } from 'nanolith';

export const worker = await define({
    // Classic example. Let's "promisify" a for-loop!
    // Note that these "task functions" can be either async or sync - doesn't matter.
    bigForLoop: (msg: string) => {
        for (const _ of Array(900000000).keys()) {
        }
        return msg;
    },
});
```

Notice that there' no bloat. Just keys and values (the "task functions").

In our index file (or wherever else), we can simple import the `worker` variable and call it. This `worker` variable is our **Nanolith** API.

```TypeScript
// index.ts
import { worker } from './worker.js';

// This will spin up a worker and run our bigForLoop function
// inside of it. Once the function returns, the promise will
// resolve with the return value and the worker's process will
// be exited.
const promise = worker({
    name: 'bigForLoop',
    params: ['test'],
});

console.log('hello world');

const result = await promise;

console.log(result);
```

## Creating services

No more weird `BackgroundWorker` stuff. Launching a service on a separate thread with **Nanolith** is super easy. Consider these definitions:

```TypeScript
// worker.ts
import { define } from 'nanolith';

export const worker = await define({
    logHello: () => console.log('hello'),
    waitThenAdd: async (num1: number, num2: number) => {
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        return num1 + num2;
    },
});
```

Let's now create a long-running service that has access to these functions.

```TypeScript
// index.ts
import { worker } from './worker.js';

const service = await worker.launchService({
    // All workers are automatically managed by the "Pool". You can prioritize certain
    // tasks/services by setting this option to true.
    priority: true,
});

// Both of these functions are being run at the
// same time within the worker thread.
const { 1: sum } = await Promise.all([
    service.call({
        name: 'logHello',
    }),
    service.call({
        name: 'waitThenAdd',
        params: [4, 5],
    }),
]);

console.log(sum);

await service.call({
    name: 'logHello',
});

service.terminate();
```

The huge difference between a launching a service vs just running a task is that you don't have to spin up a worker for every single task that is run within the service. They all run within one worker. You can spin up a (theoretically) unlimited number of services for one set of definitions.

## Multiple definitions in one file

Rather than keeping it to one set of definitions per file like in Threadz, in **Nanolith** you can now have as many as you want in a single file. To distinguish them from one another, just provide each of them an `identifier` that is unique to that file. The default identifier is literally `"default"`.

```TypeScript
// worker.ts
import { define } from 'nanolith';

export const worker = await define({
    logHello: () => console.log('hello'),
    waitThenAdd: async (num1: number, num2: number) => {
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        return num1 + num2;
    },
});

// this is not very practical, but it serves as an example
export const loggers = await define(
    {
        info: (msg: string) => console.log('INFO', msg),
        warning: (msg: string) => console.log('WARNING', msg),
    },
    {
        identifier: 'loggers',
    }
);
```

```TypeScript
// index.ts
import { worker, loggers } from './worker.js';

// These won't clash with each other, despite the fact the their
// worker scripts are running from the same file.
await worker({
    name: 'logHello',
});

await loggers({
    name: 'info',
    params: ['testing'],
});
```

## Communicating

The process to communicate between the main thread and worker threads in **Nanolith** is extremely simple. First, launch a service, then use the `sendMessage` and `onMessage` functions to send and receive messages to the worker. To do it the other way 'round, import `parent` from `nanolith` and use the same functions.

Consider this example:

```TypeScript
// worker.ts
import { define, parent } from 'nanolith';

export const messenger = await define({
    sendMessageToMain: () => {
        parent.sendMessage('Hey from worker!');
    },
    registerListener: () => {
        parent.onMessage<string>((msg) => {
            console.log('Received from main:', msg);
            parent.sendMessage('ready to terminate!');
        });
    },
});
```

```TypeScript
// index.ts
import { messenger } from './worker.js';

const service = await messenger.launchService();

service.onMessage<string>((msg) => {
    if (msg === 'ready to terminate!') return service.terminate();
    console.log('Received from worker:', msg);
});

await service.call({
    name: 'sendMessageToMain',
});

await service.call({
    name: 'registerListener',
});

service.sendMessage('Hey from main!');
```

The output of this is:

```txt
Received from worker: Hey from worker!
Received from main: Hey from main!
```

## Final words

I'm currently planning on bringing more features to **Nanolith**, such as a highly performant shared memory solution, an intuitive way to communicate between workers, and a simple way to manage loads amongst multiple services (`ServicePool`?). What you see above only scratches the surface of what's coming :)
