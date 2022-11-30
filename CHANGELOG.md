# Changelog

All notable changes to Nanolith since version 0.1.0 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- `launchService()` method from `ServiceCluster`.
- `messages` object.

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
