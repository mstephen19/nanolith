import type { Awaitable } from './utilities.js';

/**
 * A function that can be used in the `define` function when defining
 * a collection of tasks.
 */
export type TaskFunction = (...args: any[]) => Awaitable<any>;

/**
 * A collection of task functions.
 */
export type TaskDefinitions = Record<string, TaskFunction>;

export type DefineOptions = {
    file?: string;
    identifier?: string;
};
