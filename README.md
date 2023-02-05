# Nanolith

Multithreading in minutes. _(More intuitive and feature-rich than [Piscina](https://www.npmjs.com/package/piscina)!)_

> Nanolith now supports nested parent threads. Spawn threads from other threads, more threads from those threads, and so on!

[![TypeScript](https://badgen.net/badge/-/TypeScript/blue?icon=typescript&label)](https://www.typescriptlang.org/) [![CircleCI](https://circleci.com/gh/mstephen19/nanolith.svg?style=svg)](https://app.circleci.com/pipelines/github/mstephen19/nanolith) [![Install size](https://packagephobia.com/badge?p=nanolith@latest)](https://packagephobia.com/result?p=nanolith@latest)

[![Version](https://img.shields.io/npm/v/nanolith?color=blue)](https://github.com/mstephen19/nanolith/releases) ![Weekly downloads](https://img.shields.io/npm/dw/nanolith?color=violet) ![Libraries.io dependency status](https://img.shields.io/librariesio/release/npm/nanolith) [![GitHub issues](https://img.shields.io/github/issues/mstephen19/nanolith?color=red)](https://github.com/mstephen19/nanolith/issues)

<center>
    <img src="https://user-images.githubusercontent.com/87805115/210020526-2bbd427f-00d0-41cb-8ce9-7b96e5a214bd.png" width="550">
</center>

## ❔ About

✨**Nanolith**✨ is a scalable, reliable, easy-to-use, and well-documented multithreading library that allows you to easily vertically scale your Node.js applications. It serves to not only build upon, but entirely replace the _(deprecated)_ [Threadz](https://github.com/mstephen19/threadz) library.

There have always been a few main goals for Nanolith:

1. Performance & scalability 🏃
2. Ease-of-use 😇
3. Seamless TypeScript support 😎
4. Modern [ESModules](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)-only support 📈
5. Steady updates with new features & fixes 🚀

### So what can you do with it?

Here's a quick rundown of everything you can do in Nanolith:

- Offload expensive tasks to separate threads.
- Spawn up separate-threaded "nanoservices" that can run any tasks you want.
- Communicate back and forth between threads by sending messages.
- Stream data between threads with the already familiar [`node:stream`](https://nodejs.org/api/stream.html) API.
- Share memory between threads using the familiar-feeling [`SharedMap`](#-sharing-memory-between-threads) class.

## 📖 Table of contents

- [❔ About](#-about)
- [💾 Installation](#-installation)
- [📝 Defining your tasks](#-defining-your-tasks)
  - [`define()` options](#define-options)
- [👷 Running a task](#-running-a-task)
  - [Task function options](#task-function-options)
- [🎩 Understanding services](#-understanding-services)
  - [`launchService()` options](#launchservice-options)
  - [`Service` properties & methods](#service-properties--methods)
- [🎬 Coordinating services](#-coordinating-services)
  - [`ServiceCluster` properties & methods](#servicecluster-properties--methods)
- [🪝 Hooks](#-hooks)
- [🚨 Managing concurrency](#-managing-concurrency)
  - [`pool` properties & methods](#pool-properties--methods)
- [📨 Communicating between threads](#-communicating-between-threads)
  - [Between a service and the main (or a parent) thread](#between-a-service-and-the-main-or-a-parent-thread)
  - [Between all threads](#between-all-threads)
- [📡 Streaming data between threads](#-streaming-data-between-threads)
- [💾 Sharing memory between threads](#-sharing-memory-between-threads)
- [🧑‍🏫 Examples](#-examples)
- [📜 License](#-license)

## 💾 Installation

The latest version can be installed via any package manager of your choice.

```shell
npm install nanolith@latest
# or
yarn add nanolith@latest
```

Beta versions are released under the **next** tag and can be installed like this:

```shell
npm install nanolith@next
# or
yarn add nanolith@next
```

## 📝 Defining your tasks

A **task** is any function that **you** define which is accessible by Nanolith's APIs. Tasks can be defined using the `define()` function in a separate file dedicated to definitions.

```TypeScript
// worker.ts 💼
import { define } from 'nanolith';

// Exporting the variable is not a requirement, but it is
// necessary to somehow export the resolved value of the
// function in order to have access to it later on.
export const worker = await define({
    add(x: number, y: number) {
        return x + y;
    },
    async waitThenAdd(x: number, y: number) {
        await new Promise((resolve) => setTimeout(resolve, 5e3))
        return x + y;
    },
    // Functions don't have to be directly defined within the
    // object, they can be defined elsewhere outside, or even
    // imported from a totally different module.
    subtract,
});

function subtract(x: number, y: number) {
    return x - y;
};
```

By passing functions into `define()`, you immediately turn them into multithreadable **tasks**. No further configuration is required.

### `define()` options

As seen above, the first argument to `define()` is an object containing your functions. The second parameter is an object accepting the following _(optional)_ configurations:

| Name | Type | About |
|-|-|-|
| `file` | **string** | If `define()`'s file location detection is not working correctly, the true file location for the set of definitions can be provided here. |
| `identifier` | **string** | A unique identifier for the set of definitions. Overrides the auto-identifier generated by Nanolith. |
| `safeMode` | **boolean** | Whether or not to prevent the usage of the returned **Nanolith** API from within the same file where their definitions were created. Defaults to `true`. |

## 👷 Running a task

After [defining](#-defining-your-tasks) a set of tasks, you can import them and call them anywhere by directly using the **Nanolith** API resolved by the `define()` function. The only difference is that instead of being called on the main/parent thread, a new thread will be created for the task and it will be run there.

```TypeScript
// 💡 index.ts
// Importing the Nanolith API we created in worker.ts
import { worker } from './worker.js';

// Run the "add" function on a separate thread and wait
// for it to complete before moving forward.
const result = await worker({
    // Provide the name of the task.
    name: 'add',
    // Provide the parameters of the function.
    params: [2, 3],
});

// The result is sent back to the parent thread
// and resolved by the task function call.
console.log(result); // -> 5
```

The new thread's process is shut down after the task finishes.

> **📝 Note:** Notice that even with the synchronous `add()` function, it is now asynchronous when being multithreaded.

### Task function options

`name` and `params` are amongst many of the possible options that can be passed in when running a task:

| Name | Type | About |
|-|-|-|
| `name` | **string** | The name of the task to call. Must be present on the set of definitions. |
| `params` | **any[]** | The arguments for the task in array form. |
| `priority` | **boolean** | Whether or not to treat the task's worker as priority over others when being queued into the `pool`. |
| `reffed` | **boolean** | When `true`, the underlying `Worker` instance is [reffed](https://nodejs.org/api/worker_threads.html#workerref). Defaults to `false`. |
| `messengers` | [**Messenger**](#between-all-threads)**[]** | The [`Messenger`](#between-all-threads)s that should be accessible to the task. |
| `options` | **object** | An object containing _most_ of the options available on the [`Worker` constructor](https://nodejs.org/api/worker_threads.html#new-workerfilename-options). |

## 🎩 Understanding services

**Services** are Nanolith's flagship feature. Running a task on a service works similarly to [running a task](#-running-a-task) normally; however, the key difference is that the thread only shuts down when you tell it to. This means that you can run multiple tasks on the same thread rather than spawning up a new one for each call.

Considering the definitions we created [here](#-defining-your-tasks), here is how a service would be launched and a task would be called on it.

```TypeScript
// 💡 index.ts
// Importing the Nanolith API we created in worker.ts
import { worker } from './worker.js';

// Spawn up a new thread that has access to all of
// our tasks.
const service = await worker.launchService();

// Command the service thread to run the "add" function.
const result = await service.call({
    name: 'waitThenAdd',
    params: [2, 3],
});

// We can run service.call() as many times as we want, and
// all those tasks will be called on the same thread...

// Similarly to regular task calls, the return value
// is sent back to the parent thread and resolve by the call.
console.log(result);

// Shut down the second thread.
await service.close();
```

### `launchService()` options

The configurations for `Nanolith.launchService()` are nearly identical to the [task function options](#task-function-options) with the addition of `exceptionHandler`:

| Name | Type | About |
|-|-|-|
| `exceptionHandler` | **function** | An optional but _highly recommended_ option that allows you to catch uncaught exceptions within the service. |
| `priority` | **boolean** | Whether or not to treat the service's worker as priority over others when being queued into the `pool`. |
| `reffed` | **boolean** | When `true`, the underlying `Worker` instance is [reffed](https://nodejs.org/api/worker_threads.html#workerref). Defaults to `false`. |
| `messengers` | [**Messenger**](#between-all-threads)**[]** | The [`Messenger`](#between-all-threads)s that should be accessible to the service. |
| `options` | **object** | An object containing _most_ of the options available on the [`Worker` constructor](https://nodejs.org/api/worker_threads.html#new-workerfilename-options). |

### `Service` properties & methods

Along with `.call()`, `Service` offers many other properties and methods:

| Name | Type | About |
|-|-|-|
| `activeCalls` | **Property** | The current number of active calls running on the `Service` instance. |
| `closed` | **Property** | Whether or not the underlying `Worker` instance has exited its process. |
| `threadID` | **Property** | The thread ID of the underlying `Worker`. |
| `worker` | **Property** | The raw `Worker` instance being used by the service. |
| `call()` | **Method** | Call a task to be run within the service worker. Usage is similar to [running a task normally](#-running-a-task) |
| `close()` | **Method** | Terminates the worker, ending its process and marking the `Service` instance as `closed`. |
| `sendMessage()` | **Method** | Send messages to the service. |
| `onMessage()` | **Method** | Listen for and receive messages from the service. |
| `waitForMessage()` | **Method** | Wait for a specific message coming from the service. |
| `createStream()` | **Method** | Create a `Writable` instance that can be piped into in order to stream data to the service worker. |
| `onStream()` | **Method** | Listen for and receive data streams from the service. |
| `sendMessenger()` | **Method** | Dynamically send a [`Messenger`](#between-all-threads) to the service. |

## 🎬 Coordinating services

In a scalable application utilizing multiple identical [services](#launchservice-options), it is possible to optimize them by treating the main/parent thread as an orchestrator and managing the workloads on each service. Nanolith's `ServiceCluster` automatically does this for you.

```TypeScript
// 💡 index.ts
// Importing the Nanolith API we created in worker.ts.
import { worker } from './worker.js';

// Launch 6 identical services at the same time.
// Returns a "ServiceCluster" instance.
const cluster = await worker.clusterize(6, {
    // These options will be applied to all of the 6
    // services being launched.
    exceptionHandler({ error, terminate }) {
        console.error(error);
    },
    priority: true;
});

// Use the least busy service on the cluster.
// This is the service that is currently running
// the least amount of task calls.
const service = cluster.use();

// Call the task on the service as you normally would.
const result = await service.call({
    name: 'subtract',
    params: [10, 5],
});

console.log(result);

// Close all services on the cluster.
await cluster.closeAll();
```

For simplicity of the above example, we are only running a single task. However, `ServiceCluster` can be used to run a large amount of heavy operations in true parallel on multiple services.

### `ServiceCluster` properties & methods

Along with `.use()`, `ServiceCluster` offers many other properties and methods:

| Name | Type | About |
|-|-|-|
| `activeServices` | **Property** | The number of currently running services on the cluster. |
| `currentServices` | **Property** | An array of objects representing each active service on the cluster. Each object contains the `service` and its `identifier`. |
| `activeServiceCalls` | **Property** | The number of currently active task calls on all services on the cluster. |
| `launch()` | **Method** | Launch a new service and start automatically managing it with the cluster. |
| `addService()` | **Method** | Add an already running service to the cluster. |
| `use()` | **Method** | Find and return the currently least busy `Service` on the cluster. |
| `notifyAll()` | **Method** | Send a message to all running services on the cluster using
[`.sendMessage()`](#service-properties--methods). |
| `closeAll()` | **Method** | Close all active services on the cluster. |
| `closeAllIdle()` | **Method** | Close all service instances on the cluster that are currently doing nothing (not running any tasks). |

## 🪝 Hooks

For a bit of finer control over your services and tasks, three hooks are available and can be provided directly to [`define()`](#-defining-your-tasks).

```TypeScript
// worker.ts 💼
import { define } from 'nanolith';

export const worker = await define({
    // Runs before a service is launched and before the
    // "launchService" function resolves its promise.
    __initializeService(threadId) {
        console.log(`Initializing service on thread: ${threadId}`);
    },
    // Runs before a task is called.
    __beforeTask({ name, inService }) {
        console.log(`Running task ${name}.`);
        // You have access to "inService", which tells you if the
        // task will run standalone, or within a service.
        console.log(`${inService ? 'Is' : 'Is not'} in a service.`);
    },
    // Runs after a task is called.
    __afterTask({ name, inService }) {
        console.log(`Finished task ${name}`);
    },
    // Define your tasks here...
});
```

These hooks run on the same thread as their corresponding service/task.

## 🚨 Managing concurrency

Nanolith automatically manages the concurrency your services and task calls with the internal `pool` class. By default, the maximum concurrency is one thread per core on the machine. This is a safe value to go with; however, the `maxConcurrency` can be modified up using one of the available `ConcurrencyOption`s.

```TypeScript
// index.ts 💡
// Importing the pool.
import { pool, ConcurrencyOption } from 'nanolith';

// One thread per four cores.
pool.setConcurrency(ConcurrencyOption.Quarter);
// One thread per two cores.
pool.setConcurrency(ConcurrencyOption.Half);
// Default concurrency. Two threads per core (x2).
pool.setConcurrency(ConcurrencyOption.Default);
// One thread per core.
pool.setConcurrency(ConcurrencyOption.x1);
// Two threads per core.
pool.setConcurrency(ConcurrencyOption.x2);
// Four threads per core.
pool.setConcurrency(ConcurrencyOption.x4);
// Six threads per core.
pool.setConcurrency(ConcurrencyOption.x6);
// Eight threads per core.
pool.setConcurrency(ConcurrencyOption.x8);
// Ten threads per core.
// Warning: This could be overkill.
pool.setConcurrency(ConcurrencyOption.x10);
```

Access to the pool's default concurrency for the current machine's resources can be accessed like so:

```typescript
import { getDefaultPoolConcurrency } from 'nanolith';

console.log(getDefaultPoolConcurrency)
```

### `pool` properties & methods

Along with `.setConcurrency()`, `pool` offers many other properties and methods:

| Name | Type | About |
|-|-|-|
| `option` | **Property** | Easy access to the `ConcurrencyOption` enum. |
| `maxConcurrency` | **Property** | The maximum concurrency of the `pool`. |
| `maxed` | **Property** | Whether or not the pool has currently reached its max concurrency. |
| `queueLength` | **Property** | The current number of item in the pool's queue. |
| `activeCount` | **Property** | The current number of workers that are running under the pool. |
| `idle` | **Property** | A `boolean` indicating whether or not the pool is currently doing nothing. |
| `next` | **Property** | Returns the internal `PoolItemOptions` for the next worker in the queue to be run. |
| `setConcurrency()` | **Method** | Modify the `maxConcurrency` of the pool. Use this wisely. |

## 📨 Communicating between threads

There are two ways of communicating between threads in Nanolith.

### Between a service and the main (or a parent) thread

When using [services](#-understanding-services), you are automatically able to communicate between the service and main (or a parent) thread with no extra work.

The [`__initializeService()` hook](#-hooks) can be used to register listeners on the `ParentThread`:

```TypeScript
// worker.ts 💼
import { define, ParentThread } from 'nanolith';

export const worker = await define({
    // When the service is launched, this function will be
    // called.
    __initializeService() {
        // Register a listener for a message coming from the
        // parent thread.
        ParentThread.onMessage<string>((message) => {
            // Log the message when it is received.
            console.log(message);

            // Then, after the message is received, send a
            // confirmation to the parent thread.
            ParentThread.sendMessage('hello from the service!');
        });
    },
});
```

Then, the `.onMessage()` and `.sendMessage()` methods on the created [service](#-understanding-services) can be used to send messages to and receive messages from the service:

```TypeScript
// 💡 index.ts
import { worker } from './worker.js';

const service = await worker.launchService();

// After the service is launched and initialized, send
// a message to it.
service.sendMessage('hello from the parent thread');

// Register a listener for when a message is received
// from the service.
service.onMessage(async (message) => {
    // When a message is received, first log the message's
    // contents.
    console.log(message);

    // Then, close the service.
    await service.close();
});
```

### Between all threads

A bit of extra work is required when there is a need to communicate between all threads (including the parent thread). First, an instance of `Messenger` must be created. That instance can then be exposed to as many services and tasks as you want.

Within task functions, the `.use()` method on `MessengerList` can be used to grab hold of `Messenger`s exposed to the thread:

```TypeScript
// worker.ts 💼
import { define, MessengerList } from 'nanolith';

export const worker = await define({
    // When the service is launched, this function will be
    // called.
    async __initializeService() {
        // Grab hold of the exposed "foo" messenger.
        const fooMessenger = await MessengerList.use('foo');
        // Register a listener for a message received on the
        // messenger.
        fooMessenger.onMessage<string>((message) => {
            // Log the message when it is received.
            console.log(message);
            // Exit the process once any message has been received.
            process.exit();
        });
    },
    // A task function which will trigger a message to be sent
    // on the exposed "foo" messenger.
    async sendSomeMessage() {
        const fooMessenger = await MessengerList.use('foo');
        fooMessenger.sendMessage('hello from other service!');
    },
});
```

The messenger instance can be exposed to a [task call](#task-function-options) or [service](#launchservice-options) by using the `messengers` option.

```TypeScript
// 💡 index.ts
import { Messenger } from 'nanolith';
import { worker } from './worker.js';

// Create a new messenger with the ID of "foo"
const fooMessenger = new Messenger('foo');

// Launch two services that have the "foo" messenger
// exposed to both of them.
const service1 = await worker.launchService({
    messengers: [fooMessenger],
});
const service2 = await worker.launchService({
    messengers: [fooMessenger],
});

// Call the task which sends a message on the exposed
// "foo" messenger.
await service1.call({ name: 'sendSomeMessage' });

// Finally close the first service. The second will have
// already closed itself.
await service1.close();
```

> **Note:** The `Messenger` class can be used to communicate between all threads. That means between [task calls](#-running-a-task), between [services](#-understanding-services), between the parent thread and multiple services/task calls, etc.

## 📡 Streaming data between threads

It's possible to stream data from one thread to another either using [`Service`](#-understanding-services), [`Messenger`](#between-all-threads), and [`ParentThread`](#between-a-service-and-the-main-thread). All have the `.createStream()` and `.onStream()` methods.

```TypeScript
// worker.ts 💼
import { define, ParentThread } from 'nanolith';
import { createWriteStream } from 'fs';

export const worker = await define({
    __initializeService() {
        // Wait for streams coming from the parent thread.
        ParentThread.onStream((stream) => {
            const writeStream = createWriteStream('./movie.mp4');
            // Once the stream has finished, notify the parent thread
            // that the service is ready to be closed.
            stream.on('end', () => {
                ParentThread.sendMessage('close please');
            });

            // Pipe the received stream right into our created
            // write stream.
            stream.pipe(writeStream);
        });
    },
});
```

```TypeScript
// 💡 index.ts
import axios from 'axios';
import { worker } from './worker.js';
import type { Readable } from 'stream';

const service = await worker.launchService();

// Once a message has been received from the service,
// close it immediately.
service.onMessage(async () => {
    await service.close();
});

// Get a Readstream for the entire movie "Edward Scissorhands"
const { data: readStream } = await axios.get<Readable>(
    'https://stream-1-1-ip4.loadshare.org/slice/3/VideoID-qbfnKjG4/CXNa4S/uSDJeP/BXvsDm/Jmrsew/360?name=edward-scissorhands_360&token=ip=85.160.33.237~st=1672263375~exp=1672277775~acl=/*~hmac=de82d742e7cda87859d519fdbf179416d67366497f2e65c103de830b379b1e8b',
    {
        responseType: 'stream',
    }
);

// Send the stream to the service to be handled.
readStream.pipe(await service.createStream());
```

When using `Messenger`, things work a bit differently. The `.onStream()` method takes a different type of callback that must first accept the stream before handling it. This is because with messengers, there are multiple possible recipients, and not all of them might want to accept the stream.

Again, we use the [`__initializeService()` hook](#-hooks):

```TypeScript
// worker.ts 💼
import { define, MessengerList, ParentThread } from 'nanolith';
import { createWriteStream } from 'fs';

export const worker = await define({
    async __initializeService() {
        // Use the exposed "foo" messenger
        const fooMessenger = await MessengerList.use('foo');

        // Register a listener for once a stream is received.
        fooMessenger.onStream(({ metaData, accept }) => {
            // If the metadata of the stream matches what we
            // want, we will continue. Otherwise we'll decline
            // the stream by doing nothing.
            if (metaData.scissorhands !== true) return;

            // Retrieve the stream by calling the "accept" function.
            const stream = accept();

            const writeStream = createWriteStream('./movie.mp4');
            // Once the stream has finished, notify the parent thread
            // that the service is ready to be closed.
            stream.on('end', () => {
                ParentThread.sendMessage('close please');
            });

            // Pipe the received stream right into our created
            // write stream.
            stream.pipe(writeStream);
        });
    },
});
```

When it comes to actually sending the stream with `Messenger`, the workflow is nearly the same as messaging [between a service and the main (or a parent) thread](#between-a-service-and-the-main-or-a-parent-thread):

```TypeScript
// 💡 index.ts
import { Messenger } from 'nanolith';
import axios from 'axios';
import { worker } from './worker.js';
import type { Readable } from 'stream';

const fooMessenger = new Messenger('foo');

const service = await worker.launchService({
    messengers: [fooMessenger],
});

// Once a message has been received from the service,
// close it immediately.
service.onMessage(async () => {
    await service.close();
});

// Get a Readstream for the entire movie "Edward Scissorhands"
const { data: readStream } = await axios.get<Readable>(
    'https://stream-1-1-ip4.loadshare.org/slice/3/VideoID-qbfnKjG4/CXNa4S/uSDJeP/BXvsDm/Jmrsew/360?name=edward-scissorhands_360&token=ip=85.160.33.237~st=1672263375~exp=1672277775~acl=/*~hmac=de82d742e7cda87859d519fdbf179416d67366497f2e65c103de830b379b1e8b',
    {
        responseType: 'stream',
    }
);

// Send the stream on the messenger instance to be accepted
// the  subsequently handled.
// Attach some metadata to the stream to help the receivers distinguish
// it from other streams. This metadata can be anything.
readStream.pipe(await fooMessenger.createStream({ scissorhands: true }));
```

## 💾 Sharing memory between threads

In vanilla Node.js, memory can only be shared between threads using raw bytes with [`SharedArrayBuffer`](https://amagiacademy.com/blog/posts/2021-04-10/node-shared-array-buffer). That totally sucks, but luckily sharing memory is easy in Nanolith. If you're already familiar with the JavaScript [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) object, you'll feel comfortable with `SharedMap`.

In a single-threaded sense, `SharedMap` works in quite a standard way:

```TypeScript
// 💡 index.ts
import { SharedMap } from 'nanolith';

// Initialize a new SharedMap that has a key of "foo"
const myMap = new SharedMap({ foo: 'bar' });

// Set the new value of "foo" to be "hello world"
await myMap.set('foo', 'hello world');

// Grab the current value of "foo".
console.log(await myMap.get('foo'));
```

But the main point of `SharedMap` is that it can be used to share values between threads without making copies of the data. A mutex is also implemented under the hood, which means that a very large concurrency of truly parallel operations to modify the same memory location at the same time.

```TypeScript
// worker.ts 💼
import { define, SharedMap } from 'nanolith';
import type { SharedMapRawData } from 'nanolith';

export const worker = await define({
    // Create a task that accept a raw data object that can be converted into a
    // SharedMap instance.
    async handleMap(raw: SharedMapRawData<{ count: number }>) {
        // Instantiate a SharedMap instance based on the received raw data.
        const countMap = new SharedMap(raw);

        // Increment the count a thousand times.
        for (let i = 1; i <= 1000; i++) {
            // Use a callback function inside ".set()" to set the new value based
            // on the previously existing value.
            await countMap.set('count', (prev) => {
                return +prev + 1;
            });
        }
    },
});
```

```TypeScript
// 💡 index.ts
import { SharedMap } from 'nanolith';
import { worker } from './worker.js';

// Initialize a new SharedMap that has a key of "foo"
const countMap = new SharedMap({ count: 0 });

// Run 5 task functions in true parallel which will each increment
// the count by one thousand.
await Promise.all([
    worker({ name: 'handleMap', params: [countMap.raw] }),
    worker({ name: 'handleMap', params: [countMap.raw] }),
    worker({ name: 'handleMap', params: [countMap.raw] }),
    worker({ name: 'handleMap', params: [countMap.raw] }),
    worker({ name: 'handleMap', params: [countMap.raw] }),
]);

// This can be expected to be "5000"
console.log(await countMap.get('count'));
```

Notice that the `.get()` method will always return a stringified version of the value.

## 🧑‍🏫 Examples

Examples coming soon!

<!-- todo: Add examples -->

## 📜 License

The MIT License (MIT)

Copyright (c) 2023 Matthias Stephens

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
