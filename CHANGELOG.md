# Changelog

All notable changes to Nanolith since version 0.1.0 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `SharedMap` implementation (still badly needs a mutex of some sort)

### Changed

- Add `timeoutSecs` parameter to `prepareWritableToPortStream()` to configure how many seconds to wait for the stream to be accepted before rejecting the promise.
- `TaskWorkerOptions` and `ServiceWorkerOptions` types to be exported as `LaunchTaskOptions` and `LaunchServiceOptions` instead.
- Main file to export types `SharedArrayPair` and `MessengerTransferData`.
- `SharedArrayPair` type name to `SharedMapTransferData`.
- `Messenger.transfer()` to be a getter instead of a function.
- Removed `Data` word from exports of `SharedMapTransferData` and `MessengerTransferData`.

### Added

- `notifyAll()` method to `ServiceCluster` to send messages to all services on the cluster with one function call.

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
