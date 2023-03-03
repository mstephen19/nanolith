# Changelog

All notable changes to Nanolith since version 0.1.0 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.3] 2023-2-3

### Changed

- Some minor refactors.

### Added

- `SharedMap.entries()` method for asynchronously iterating over map keys and values + docs.
- More keywords to package.json.

### Fixed

- Task/service calls throwing an error when the worker exits early with exit code 0.
- Some JSDoc typos & unnecessary spaces.
- SharedMap keys containing unnecessary commas that take up extra space.

### Removed

- Empty **Examples** section in README.
- Replaced content in README **License** section with a link to the license in the GitHub repository.

## [0.4.2] - 2023-8-2

### Changed

- Minor refactors & performance improvements.
- README image.

### Added

- `ServiceClusterOptions` and optional `autoRenew` option.
- Accept exit codes in the `Service.close()` and `exceptionHandler.terminate()` functions.
- `SharedMap.delete()` method.
- New clause to the license.

### Fixed

- `SharedMap.get()` returning `null` for non-existent properties, but returning the string of `'null'` for existing properties with values set to `null`.
- `Service.call()` hanging forever if the underlying task uses `process.exit()`.

## [0.4.1] - 2023-5-2

### Changed

- `pool` to use shared values for the active count and concurrency count, enabling the spawning of new threads from other threads.
- `pool` to allow for the enqueuing of new items on all threads.
- `define()` to always return the `Nanolith` instance, regardless of whether or not it is being run on the main thread.
- Renamed `MainThread` to `ParentThread` to match the changes made above + update docs.
- Change "performant" to "scalable" in "About" section in README.
- Renamed all `MainThread...` message body types to be `ParentThread...` instead.
- Default max concurrency of `pool` from 1 thread per core to 2 threads per core + docs update.

### Added

- Test for the `safeMode` option with `define()`.
- `getDefaultPoolConcurrency()` function exported from root + docs.

## [0.3.7] - 2023-21-01

### Changed

- Mutex solution for `SharedMap` to be much more stable
- `workerHandler` to exit the process with a code of `1` when no `type` is present on `workerData`.
- Refactored `prepareWritableToPortStream` timeout logic.

### Removed

- `SharedMap.watch` functionality + docs.
- Warning in README about parallel operations with `SharedMap`.

### Added

- Throw an error when no task name is provided when running a task worker.

## [0.3.4] - 2023-11-01

### Changed

- Sentence in "Sharing memory between threads" section of the README.
- `.current` and `.changed` from getter properties to functions on the `SharedMapWatch` interface.
- `#streamEventCallbacks` used by `Messenger`'s `Messagable` interop to be in a `Set` instead of an array.
- Various minor performance and memory improvements to `SharedMap`.
- `ServiceCluster.launch` to return a tuple of `Service`s when provided with the `1` parameter instead of a single `Service`. Prevents potential bugs when providing dynamic numbers to the function.

### Added

- `SharedMapWatch` interface with JSDoc documentation for each function.
- Missing "`Service` properties & methods" section in README table of contents.
- Small warning about `SharedMap` to the README.

### Removed

- Deleted `OLD_README.md`

### Fixed

- Outdated examples in the README still using the `SharedMap.transfer` method the `SharedMapTransfer` type.

## [0.3.3] - 2022-30-12

### Changed

- `Messenger.transfer` to `Messenger.raw` + renaming of `MessengerTransferData` type to `MessengerRawData`
- `SharedMap.transfer` to `SharedMap.raw` + renaming of `SharedMapTransferData` type to `MessengerRawData`
- Slightly lower bundle size by minimizing the size of the published package.json file.

### Fixed

- Minor performance updates for `ServiceCluster`.

### Added

- `.watch()` method to `SharedMap` + docs + test
- `RemoveListenerFunction` return values for `.onStream()` method on `Service`, `MainThread`, and `Messenger`.
- More tests for `service_cluster` and `streams` suites.
- New keywords to the package.json

## 0.3.1 - 2022-29-12

### Fixed

- Typos in README.
- `SharedMap.option` only accessible statically and not on instances.

### Changed

- `MessengerList.list()` to be a getter method instead of a regular function. New syntax is `MessengerList.list`.
- `SharedMap.get()` to use `.subarray()` instead of `.slice()` for a slight memory complexity improvement.
- README logo image to new blue version.
- Improve validation in `SharedMap`'s constructor.
- `pool.option` back to a regular getter property instead of a static one. Doesn't need to be static.

### Added

- New sections to README for properties & methods of `Service`, `ServiceCluster`, and `pool`.
- Tests for streaming with `Messenger` + a test suite for `SharedMap`

## [0.3.0] - 2022-29-12

### Removed

- `__beforeServiceTask` and `__afterServiceTask` hooks in favor of universal `__beforeTask` and `__afterTask` hooks with new context.

### Changed

- README streaming examples to use `.shift()` instead of `.splice()`.
- Context of `TaskHook`s to contain the name of the task being called and whether or not it's being called within a service.
- `ServiceCluster.launch` to disallow negative or non-whole numbers.
- Rename `parent` to `MainThread`, which makes much more sense anyways since the parent thread is always the main thread in Nanolith.
- Rename `messengers` to `MessengerList`.
- Rename `MessengerList.seek()` to `MessengerList.list()`.
- General overall refactor + minor performance improvements.
- README revamp.

### Fixed

- `__afterTask` hook being called after the returned value was posted back to the main thread instead of before.
- Weird exclusion of `HookDefinitions` keys in `Tasks` type.
- Needing to close all `SharedMap` instances, otherwise the thread would hang even if nothing else is happening.
- Errors when initializing `SharedMap` with an empty object.

### Added

- Functionality for setting new keys on `SharedMap` instances rather than throwing an error.
- The ability to set new values on `SharedMap` based on the previous value. This is fantastic for high-concurrency parallel operations and eliminates all race conditions.
- `Nanolith.clusterize` method for easy creation of a service cluster and launching services all at the same time.

## [0.2.5] - 2022-24-12

### Added

- `SharedMap` implementation
- New `Bytes` enum export to help users with calculating sizes for their `SharedMap`s
- `notifyAll()` method to `ServiceCluster` to send messages to all services on the cluster with one function call.
- Path aliases for all main features (for easy importing/exporting).
- Support for `NodeNext` module resolution.
- "LICENSE" file containing MIT license.
- Docs for `SharedMap`.

### Changed

- Add `timeoutSecs` parameter to `prepareWritableToPortStream()` to configure how many seconds to wait for the stream to be accepted before rejecting the promise.
- `TaskWorkerOptions` and `ServiceWorkerOptions` types to be exported as `LaunchTaskOptions` and `LaunchServiceOptions` instead.
- Main file to export types `SharedArrayPair` and `MessengerTransferData`.
- `SharedArrayPair` type name to `SharedMapTransferData`.
- `Messenger.transfer()` to be a getter instead of a function.
- Removed `Data` word from exports of `SharedMapTransferData` and `MessengerTransferData`.
- `pool.option` to be a static property.
- Moved constants that were in type files to their own dedicated files within the "constants" directory. Likely will do this with utilities in the future as well.
- Switched tsconfig `moduleResolution` to NodeNext.

## [0.2.4] - 2022-08-12

### Added

- `onStream()` and `createStream()` support for streaming data between `Messenger` instances on separate threads + docs.
- Extra functionality for `listenForStream()` to allow for accepting or not accepting a stream on a `Messenger` channel.
- Docs for streaming on the `Messenger` API.

### Changed

- Refactored `Messenger`
- `Service`, `Messenger`, and `parent` `.onMessage` methods to return a function that removes the listener.
- `parent` `.onMessengerReceived` function to return a function that removes the listener.
- Docs to reflect removals of `offMessage`

### Fixed

- `MessengerTransferObject`s being applied after `__initializeService()` is called.

### Removed

- `offMessage` from `Service`, `Messenger`, and `parent`

## [0.2.3] - 2022-05-12

### Added

- `parent.onStream()` and `parent.createStream()` methods
- `Service.createStream()` and `Service.onStream()` methods
- "Streaming data between threads" section in the docs
- `waitForMessage()` method to `Service` + docs
- `waitForMessage()` method to `Messenger` + docs

### Changed

- "Sending messages from the main thread to a service" README title to "Messaging between the main thread and a service"

### Fixed

- `parent.waitForMessenger()` not working when registered in an `__initializeService()` hook call.

## [0.2.2] - 2022-03-12

### Added

- package.json `homepage` and `bugs` URLs

## [0.2.1] - 2022-03-12

### Changed

- if-statements for message type to switch-statements (easier to read + scalable + micro performance upgrade)
- Docs on definitions identifiers to reflect the new `autoIdentifier`s

### Added

- Test for `activeCalls` getter on `Service`
- "Installation" section to README
- `autoIdentifier` option to `DefineOptions`

### Removed

- `launchService()` method from `ServiceCluster`.
- `messages` object.
- Disabled `declarationMap` as it is unnecessary (.ts files don't go onto NPM) - lowers install size

### Fixed

- Eradicated the maxListeners reached error with Services.

## [0.2.0] - 2022-30-11

### Added

- Export `TaskDefinitions`, `Nanolith`, `TaskWorkerOptions`, and `ServiceWorkerOptions` types from the main index file.
- `closeAll()` method to `Messenger`.
- `setRef()` method to `Messenger`.
- Docs for `closeAll()` and `setRef()` under "Using Messenger".
- `launch()` method to `ServiceCluster`.
- Docs for `launch()`.
- `messengers` object (identical to `messages`).

### Changed

- Fixed typos and revamped README.
- Refactored `Messenger` constructor.
- Performance refactor for `ServiceCluster`.

### Deprecated

- `launchService()` method on `ServiceCluster`.
- `messages` object in favor of new identical `messengers` object.

## [0.1.3] - 2022-02-11

## Added

- `activeCalls` property to `Service` + docs.
- `__beforeServiceTask` and `__afterServiceTask` hooks + docs.
- `safeMode` option to `DefineOptions` + docs.
- "License" section to the README

### Changed

- Fixed various typos in README and JSDoc comments + general improvements.
- Removed `calling` and `called` events from `Service`.
- Same-file calling to be handled on the `define()` level instead of within `runTaskWorker` or `runServiceWorker`.
- Description in package.json to "Multithreaded nanoservices in no time with seamless TypeScript support."
- "About" section in README.

### Fixed

- Some typos in the README.

## [0.1.1] - 2022-24-10

### Added

- Support for an automatically called `__initializeService` hook when launching a service + docs.
- New internal `Initialized` worker message type.
- "Using a service initializer task function" section in README.
- `closeAllIdle()` method to `ServiceCluster` + docs.
- `threadID` getter to `Service` + docs.
- `currentServices` getter to `ServiceCluster` + docs.
- Extra keywords to `package.json`.
- `worker` getter to `Service` + docs.
- `waitForMessage` function to `parent`.
- "What's new?" section to README.
- Support for new `__beforeTask` and `__afterTask` hooks when calling a task + docs.
- `messages.seek()` method.
- "Communicating between threads" section to README.

### Changed

- `runServiceWorker`'s listener on `worker` from the `"online"` event to the new custom `Initialized` message type.
- "Nanoservices in no time." in README to "Nanoservices in no time with seamless TypeScript support."
- Some `.on` listeners to `.once` instead.
- The `.use()` method on `ServiceCluster` to also support service identifier input.
- `TaskDefinitions` type to include special typing for `__initializeService` function
- `Hook`s to now have the `threadID` passed into them as the argument + docs.

### Fixed

- Max listeners reached error by cleaning up listeners and increasing the limit to 100.
