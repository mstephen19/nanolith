# Changelog

All notable changes to Nanolith since version 0.1.0 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Support for an automatically called `__initializeService` function when launching a service.
- New internal `Initialized` worker message type.
- "Using a service initializer task function" section in README.
- `closeAllIdle()` method to `ServiceCluster` + docs.
- `threadID` getter to `Service` + docs.
- `currentServices` getter to `ServiceCluster` + docs.
- Extra keywords to `package.json`.
- `worker` getter to `Service` + docs.
- `waitForMessage` function to `parent`.
- "What's new?" section to README.

### Changed

- `runServiceWorker`'s listener on `worker` from the `"online"` event to the new custom `Initialized` message type.
- "Nanoservices in no time." in README to "Nanoservices in no time with seamless TypeScript support."
- Some `.on` listeners to `.once` instead.
- The `.use()` method on `ServiceCluster` to also support service identifier input.

### Fixed

- Max listeners reached error by cleaning up listeners and increasing the limit to 100.
