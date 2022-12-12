# Nanolith

Multithreading in minutes.

[![TypeScript](https://badgen.net/badge/-/TypeScript/blue?icon=typescript&label)](https://www.typescriptlang.org/) [![CircleCI](https://circleci.com/gh/mstephen19/nanolith.svg?style=svg)](https://app.circleci.com/pipelines/github/mstephen19/nanolith) [![Install size](https://packagephobia.com/badge?p=nanolith@latest)](https://packagephobia.com/result?p=nanolith@latest)

[![Version](https://img.shields.io/npm/v/nanolith?color=blue&style=for-the-badge)](https://github.com/mstephen19/nanolith/releases) ![Weekly downloads](https://img.shields.io/npm/dw/nanolith?color=violet&style=for-the-badge) ![Libraries.io dependency status](https://img.shields.io/librariesio/release/npm/nanolith?style=for-the-badge) [![GitHub issues](https://img.shields.io/github/issues/mstephen19/nanolith?color=red&style=for-the-badge)](https://github.com/mstephen19/nanolith/issues)

<center>
    <img src="https://user-images.githubusercontent.com/87805115/199340985-d76cc3ea-6abb-4a4e-ac1b-a95fc693947f.png" width="550">
</center>

## ❔ About

✨**Nanolith**✨ is a performant, reliable, easy-to-use, and well-documented multithreading library. It serves to not only build upon, but entirely replace the _(deprecated)_ [Threadz](https://github.com/mstephen19/threadz) library.

There have always been three main goals for Nanolith:

1. Performance 🏃
2. Ease-of-use 😇
3. Seamless TypeScript support 😎

### So what can you do with it?

Here's a quick rundown of everything you can do in Nanolith:

- Offload expensive tasks to separate threads.
- Spawn up separate-threaded "nanoservices" that can run any tasks you want.
- Communicate back and forth between threads by sending messages.
- Stream data between threads with the already familiar [`node:stream`](https://nodejs.org/api/stream.html) API.

## 📖 Table of contents

- [❔ About](#about-❔)
- [💾 Installation](#💾-installation)
- [📝 Defining your tasks](#📝-defining-your-tasks)
  - [`define()` options](#define-options)
- [👷 Running a task](#👷-running-a-task)
- [🎩 Understanding services](#🎩-understanding-services)
- [🚨 Managing concurrency](#🚨-managing-concurrency)
- [🎬 Coordinating services](#🎬-coordinating-services)
- [📨 Communicating between threads](#📨-communicating-between-threads)
- [📡 Streaming data between threads](#📡-streaming-data-between-threads)
- [📜 License](#license-📜)

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

A **task** is any function that **you** define which is accessible by Nanolith's APIs. Tasks can be defined using the `define()` function in a separate file dedicated to your definitions.

```TypeScript
// worker.ts 💼
import { define } from 'nanolith';

// Exporting the variable is not a requirement, but it is
// necessary to somehow export the resolved value of the
// function in order to have access to it later on.
export const api = await define({
    add(x: number, y: number) {
        return x + y;
    },
    async waitThenAdd(x: number, y: number) {
        await new Promise((resolve) => setTimeout(resolve, 5e3))
        return x + y;
    },
    // Functions don't have to be directly defined within the
    // object, they can be defined elsewhere outside, or even
    // imported from a different module.
    subtract,
});

function subtract(x: number, y: number) {
    return x - y;
};
```

By passing functions into `define()`, you immediately turn them into **tasks** that are ready to be called on separate threads.

### `define()` options

<!-- What is a task? Simply put, it's just any function. -->
<!-- How to define tasks with the "define" function -->
<!-- DON'T GO OVER HOOKS HERE! -->
<!-- Quickly go over the options within "define" -->

## 👷 Running a task

<!-- How to run a task. -->
<!-- Go over the configuration options available. -->
<!-- Go over hooks supported with tasks. -->

## 🎩 Understanding services

<!-- Explain the huge difference between running a task regularly vs running tasks within a service -->
<!-- Go over launching, configuring, and calling tasks on a service. -->

## 🚨 Managing concurrency

<!-- Discuss pool, what it does, and how to configure it (if needed) -->

## 🎬 Coordinating services

<!-- Explain what service clusters are and how they can help -->
<!-- Talk about available methods -->

## 📨 Communicating between threads

<!-- Discuss the two types of messaging that are supported in Nanolith -->

## 📡 Streaming data between threads

<!-- Discuss using the streaming API on parent, Messenger, or Service -->

## 📜 License

The MIT License (MIT)

Copyright (c) 2022 Matthias Stephens

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
