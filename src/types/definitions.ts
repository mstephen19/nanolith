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
    /**
     * If `define`'s default file location detection is not working correctly,
     * the true file location for the set of definitions can be provided here.
     */
    file?: string;
    /**
     * A unique identifier that can be used when creating multiple sets of definitions
     * in the same file to avoid nasty clashing.
     */
    identifier?: string;
};
