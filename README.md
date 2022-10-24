# Nanolith

[![CircleCI](https://circleci.com/gh/mstephen19/nanolith.svg?style=svg)](https://app.circleci.com/pipelines/github/mstephen19/nanolith) [![install size](https://packagephobia.com/badge?p=nanolith@0.1.1-beta2)](https://packagephobia.com/result?p=nanolith@latest)

![npm](https://img.shields.io/npm/v/nanolith?color=blue&style=for-the-badge) ![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/nanolith?style=for-the-badge) ![npm](https://img.shields.io/npm/dw/nanolith?color=violet&style=for-the-badge) ![npm bundle size](https://img.shields.io/bundlephobia/min/nanolith?color=lightgreen&style=for-the-badge) ![GitHub issues](https://img.shields.io/github/issues/mstephen19/nanolith?color=red&style=for-the-badge)

<center>
    <img src="https://user-images.githubusercontent.com/87805115/194834608-fe9975a4-449c-4aee-8bd5-3f44ed73662b.png" alt="Nanolith logo" width="450">
</center>

Nanoservices in no time with seamless TypeScript support.

## Table of Contents

* [About](#about)
* [What's new?](#whats-new)
* [Defining a set of tasks](#defining-a-set-of-tasks)
  * [Creating multiple sets of definitions in the same file with `identifier`s](#creating-multiple-sets-of-definitions-in-the-same-file-with-identifiers)
  * [Hooks](#hooks)
  * [Dealing with "Cannot find module" with the `file` option](#dealing-with-cannot-find-module-with-the-file-option)
* [Running a task](#running-a-task)
  * [Configuring a task](#configuring-a-task)
  * [Using the before and after task hooks](#using-the-before-and-after-task-hooks)
* [Launching a service](#launching-a-service)
  * [Configuring a service](#configuring-a-service)
  * [Using a service](#using-a-service)
  * [Using the service initializer hook](#using-the-service-initializer-hook)
* [Managing concurrency](#managing-concurrency)
  * [Using `pool`](#using-pool)
* [Creating a service cluster](#creating-a-service-cluster)
  * [Using `ServiceCluster`](#using-servicecluster)
* [Communicating between threads](#communicating-between-threads)
* [Fun example](#fun-example)

## About

[Threadz](https://github.com/mstephen19/threadz) gets the job done, but after getting various feedback on its APIs, I realized that it is overly complex. You have the `Threadz` API for running one-off tasks within short-term workers, the `Interact` API for running one-off tasks, but sending messages to them, the `BackgroundThreadzWorker` API for running workers that are long-running services, the `Communicate` API for communicating between workers, etc. Each of these APIs has their own methods that need to be learned by reading the documentation. Additionally, the configuration of workers was placed poorly, and did not allow for flexibility. Overall, Threadz has turned into a hot coupled mess.

So how's **Nanolith** any different? Other than being more performant, more reliable, and having even more seamless TypeScript support, Nanolith has just two APIs. The **Nanolith API** can be used to call one-off workers, and directly on that API, the `launchService()` function can be called to launch a long-running worker that has access to your function definitions that will only finish once it's been told to `terminate()`. When you launch a service, you are immediately able to communicate back and forth between the worker and the main thread with no other APIs needed.

Enough talk though, let's look at how this thing works.

## What's new?

The newest stable version of Nanolith is `0.1.1`.

### Features

* Support for an automatically called `__initializeService` [hook](#hooks) when launching a service.
* Support for new `__beforeTask` and `__afterTask` [hooks](#hooks) when calling a task.
* `closeAllIdle()` method and `currentServices` property on [`ServiceCluster`](#using-servicecluster).
* Support for an `identifier` parameter in the `.use()` method on [`ServiceCluster`](#using-servicecluster).
* `threadID` and raw `worker` properties now available on [`Service`](#using-a-service) instances.
* New `waitForMessage()` function under `parent`.

### Fixes

* **Possible EventEmitter memory leak detected** error (thrown from `Worker` instances when calling many tasks on a service) fixed by cleaning up _all_ listeners and increasing the limit with `setMaxListeners`.

## Defining a set of tasks

No matter what your use-case of Nanolith is, you will always start with the `define()` function. This function takes an object containing (sync or async) task definitions, and returns an object representing the **Nanolith API**, which can be used to access Nanolith's main functionalities.

To get started, create a separate file dedicated to task definitions and export a variable pointing to the awaited value of the `define()` function containing your definitions.

```TypeScript
// definitions.ts
import { define } from 'nanolith';

const subtract = (x: number, y: number) => x - y;

// Exporting the variable is not a requirement, but is necessary in order to
// have access to the API later on.
export const api = await define({
    add(x: number, y: number) {
        return x + y;
    },
    async waitThenAdd(x: number, y: number) {
        await new Promise((resolve) => setTimeout(resolve, 5e3))
        return x + y;
    },
    // Functions don't have to be directly define within the object parameter,
    // they can be defined elsewhere, or even imported.
    subtract,
});
```

The `add()`, `waitThenAdd()`, and `subtract()` functions are now ready to be run on a thread.

### Creating multiple sets of definitions in the same file with `identifier`s

Because of Nanolith runs workers directly within the same file you created your task definitions, you need to provide any second or third sets of definitions with a **constant** and **unique** `identifier` so Nanolith knows which code to run within the worker. This information can be provided in the options parameter of the `define()` function.

```TypeScript
// definitions.ts
import { define } from 'nanolith';

const subtract = (x: number, y: number) => x - y;

// The identifier for this set of definitions will be "default"
export const api = await define({
    add(x: number, y: number) {
        return x + y;
    },
    async waitThenAdd(x: number, y: number) {
        await new Promise((resolve) => setTimeout(resolve, 5e3))
        return x + y;
    },
    subtract,
});

// The identifier for this set will be "logger"
export const logger = await define({
    sayHello: () => console.log('hello'),
}, { identifier: 'logger' });
```

Issues will occur when multiple sets of definitions are present in the same file, but unique identifiers aren't assigned.

### Hooks

You may run into situations where you want to run a certain function before/after each task is called, or before a service is launched. There are three hooks which are available for use when creating a set of definitions that allow for these cases to be handled. These hooks have specific names, and are functions that take one parameter (the worker's `threadID`) and return nothing.

| Name | Functionality |
|-|-|
| `__initializeService()` | A function which will be automatically called once when a service for the set of definitions is launched. If asynchronous, it will be awaited. Note that the `launchService()` function's promise resolves only after this function has completed. |
| `__beforeTask()` | A function which will be automatically called before each task function is run. Not supported with services. |
| `__afterTask()` | A function which will be automatically called after each task function is run. Not supported with services. |

### Dealing with "Cannot find module" with the `file` option

Though it shouldn't happen, in some strange cases there is a chance that an error like this will occur when the Nanolith `pool` instance tries to spawn a worker:

```text
Error: Cannot find module '/some/path/to/some/file.js'
```

If this occurs, it means that Nanolith failed to correctly determine the location of the file in which you called `define()`. Correct this error by providing the proper path under the `file` option.

```TypeScript
// definitions.ts
import { define } from 'nanolith';

const subtract = (x: number, y: number) => x - y;

export const api = await define({
    add(x: number, y: number) {
        return x + y;
    },
    async waitThenAdd(x: number, y: number) {
        await new Promise((resolve) => setTimeout(resolve, 5e3))
        return x + y;
    },
    subtract,
}, { file: '/correct/path/to/some/file.js' });
```

## Running a task

Tasks are one-off workers that are spawned, run the specified task function, then are immediately terminated automatically. The return value of the task function is available back on the main thread when using the Nanolith API.

> All tasks are async, regardless of whether or not the defined task function is async.

Considering the task definitions from the section above, this is how the `add()` task would be run on a separate thread.

```TypeScript
// index.ts
import { api } from './definitions.js';

// This spawns a new worker, runs the "add" function, sends the
// return value back to the main thread, then terminates the worker.
const sum = await api({
    name: 'add',
    params: [4, 5],
})

// This also spawns a new worker and runs the same workflow as
// described above
const sum2 = await api({
    name: 'add',
    params: [10, 6],
})

console.log(sum) // -> 9
console.log(sum2) // -> 16
```

That's it! Simply call the **Nanolith API** directly providing the name of the task along with the parameters (if any) to pass to the task function, and the function will be run on a separate thread. Any errors thrown by the function can be safely handled by using a [`try...catch`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) block.

### Configuring a task

When running a task, there are more configurations available other than the `name` and `params` of the task function.

| Option | Type | Default | Description |
|-|-|-|-|
| `name` | string | - | The name of the task function to run. |
| `params` | array | `[]` | The parameters to pass to the task function. |
| `priority` | boolean | `false` | Whether or not to push the worker to the front of the `pool`'s queue and treat it as a priority task. |
| `reffed` | boolean | `true` | When `true`, [`worker.ref()`](https://nodejs.org/api/worker_threads.html#workerref) will be called. When `false`, [`worker.unref()`](https://nodejs.org/api/worker_threads.html#workerunref) will be called. |
| `options` | [WorkerOptions](https://nodejs.org/api/worker_threads.html#new-workerfilename-options) | `{}` | An object containing _most_ of the options available on the `Worker` constructor. |
| `messengers` | Messenger[] | `[]` | An array of `Messenger` objects to expose to the task's worker. |

### Using the before and after task hooks

When calling tasks, you might want to run the same piece of logic before or after each task (or both). Luckily, rather than copying and pasting the same logic into each task function in your set of definitions, you can use the `__beforeTask` and `afterTask` [hooks](#hooks) on your set of definitions.

## Launching a service

Services differ from tasks, as they are not one-off workers. They are long-running workers that will continue running until they are `close()`d. A service has access to all of the task functions in the set of definitions it is using.

```TypeScript
// index.ts
import { api } from './definitions.js';

// Spawns a service worker and waits for it to go
// "online" before resolving
const service = await api.launchService({
    // Provide an exception handler to know when an uncaught exception
    // is thrown by the underlying worker, and handle it as needed.
    // If this is not provided, uncaught exceptions will go unseen.
    exceptionHandler: ({ error }) => {
        console.error('oops!', error.message);
    }
});

// Runs the "add" function in the worker created by the
// "launchService" function
const sum = await service.call({
    name: 'add',
    params: [4, 5],
})

// Also runs the "add" function in the worker created by
// the "launchService" function
const sum2 = await service.call({
    name: 'add',
    params: [10, 6],
})

console.log(sum) // -> 9
console.log(sum2) // -> 16

// Terminates the worker
await service.close();
```

### Configuring a service

Similar to running a task, various options are available when configuring a service. The `launchService()` function accepts all of the following options.

| Option | Type | Default | Description |
|-|-|-|-|
| `exceptionHandler` | Function | - | An optional but recommended option that allows for the catching of uncaught exceptions within the service. |
| `priority` | boolean | `false` | Whether or not to push the worker to the front of the `pool`'s queue and treat it as a priority task. |
| `reffed` | boolean | `true` | When `true`, [`worker.ref()`](https://nodejs.org/api/worker_threads.html#workerref) will be called. When `false`, [`worker.unref()`](https://nodejs.org/api/worker_threads.html#workerunref) will be called. |
| `options` | [WorkerOptions](https://nodejs.org/api/worker_threads.html#new-workerfilename-options) | `{}` | An object containing _most_ of the options available on the `Worker` constructor. |
| `messengers` | Messenger[] | `[]` | An array of `Messenger` objects to expose to the service worker. |

### Using the service initializer hook

There may be times when you want to have a task function be automatically called right when the service goes online. This is called a **service initializer** [hook](#hooks), and it can be used to register listeners on the `parent` or on a `Messenger` instance, or to do any other internal configuration of the service before any tasks can be called on it.

To create a service initializer function, simply name one of your task definitions `__initializeService` and define your initialization logic there. The function will be run immediately after the service goes online, and the `launchService()` function will only resolve after the initialization function has completed its work.

### Using a service

The main method on launched services that you'll be using is `.call()`; however, there are many more properties and methods available.

| Name | Type | Description |
|-|-|-|
| `threadID` | Property | The thread ID of the underlying worker for the `Service` instance. |
| `closed` | Property | Whether or not the underlying worker has exited its process. This will be `true` after calling `await service.close()`|
| `worker` | Property | Returns the raw underlying `Worker` instance being used by the service.. |
| `call()` | Method | Call a task to be run within the service worker. |
| `close()` | Method | Terminates the worker, ending its process and marking the `Service` instance as `closed`. |
| `sendMessage()` | Method | Send a message to the service worker. |
| `onMessage()` | Method | Receive messages from the service worker. |
| `offMessage()` | Method | Remove a callback function added with `onMessage()`. |
| `sendMessenger()` | Method | Dynamically send a `Messenger` object to the service worker. |

## Managing concurrency

To keep things safe, Nanolith automatically manages the creation of workers with a single instance of the internal `Pool` class. By default, the concurrency of the `pool` is equal to the number of cores on the machine currently running the process; however, it can be changed by using the `.setConcurrency()` method and `ConcurrencyOption`.

```TypeScript
// index.ts
import { pool, ConcurrencyOption } from 'nanolith';

// One thread per four cores.
pool.setConcurrency(ConcurrencyOption.Quarter);
// One thread per two cores.
pool.setConcurrency(ConcurrencyOption.Half);
// Default concurrency. One thread per core (x1).
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
pool.setConcurrency(ConcurrencyOption.x10);
```

### Using `pool`

The global `pool` instance has various properties and methods that can be accessed.

| Name | Type | Description |
|-|-|-|
| `option` | Property | A direct reference to the `ConcurrencyOption` enum. |
| `maxConcurrency` | Property | The currency maximum concurrency of the pool. Can be changed with `setConcurrency()` |
| `maxed` | Property | Whether or not the pool has reached its max concurrency. |
| `queueLength` | Property | The current number of item in the pool's queue. |
| `activeCount` | Property | The current number of workers that are running under the pool. |
| `idle` | Property | A boolean defining whether or not the pool is currently doing nothing. |
| `next` | Property | Returns the internal `PoolItemOptions` for the next worker in the queue to be run. |
| `setConcurrency()` | Method | Modify the concurrency of the pool. Use this wisely. |

## Creating a service cluster

When you have multiple services using the same set of task definitions, it is difficult to manually allocate tasks to each of them. For example, if you have 3 services running that all have access to the `formatVideo()` function, you would ideally like to run the next call for `formatVideo()` on the service that is currently the least busy. This is the purpose of the `ServiceCluster` API.

```TypeScript
// index.ts
import { ServiceCluster } from 'nanolith';
import { api } from './definitions.js';

const cluster = new ServiceCluster(api);

// Launch three services that will be managed by the cluster
await cluster.launchService();
await cluster.launchService();
await cluster.launchService();

// The ".use()" method returns the least busy service out of all
// the services.
const promise1 = cluster.use().call({
    name: 'waitThenAdd',
    params: [4, 3]
})

// This call will run on a different service from the first one,
// because the first one has one active call, while the others
// have zero.
const promise2 = cluster.use().call({
    name: 'waitThenAdd',
    params: [4, 5]
})

const [sum1, sum2] = await Promise.all([promise1, promise2]);

console.log(sum1) // -> 7
console.log(sum2) // -> 9

// Close all services attached to the cluster.
await cluster.closeAll();
```

### Using `ServiceCluster`

Each `ServiceCluster` instance has access to a few methods and properties.

| Name | Type | Description |
|-|-|-|
| `activeServices` | Property | The number of currently running services on the cluster. |
| `activeServiceCalls` | Property | The number of currently active task calls on all services on the cluster. |
| `currentServices` | Property | An array of objects for each active service on the cluster. Each object contains the `service`, its current `active` count, and its unique `identifier`. |
| `launchService()` | Method | Launch a new service on the provided **Nanolith API**, and automatically manage it with the `ServiceCluster`. |
| `addService()` | Method | Add an already running service to to the cluster. |
| `use()` | Method | Returns the `Service` instance on the cluster that is currently the least active. If no services are active on the cluster, an error will be thrown. |
| `closeAll()` | Method | Runs the `close()` method on all `Service` instances on the cluster. |
| `closeAllIdle()` | Method | Runs the `close()` method on all `Service` instances on the cluster which are currently not running any tasks. |

## Communicating between threads

<!-- todo: Go over the two ways of communicating: between main thread and worker on Service, or with Messenger -->

These docs are still under construction! This section will soon be fleshed out. If you're eager to learn how to communicate amongst threads in Nanolith, check out the JSDoc examples for the exported values `parent`, `messages`, `Messenger`, and `Service`.

## Fun example

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

Notice that there's no bloat. Just keys and values (the "task functions").

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
