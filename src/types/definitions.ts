import type { Awaitable, Except } from './utilities.js';

/**
 * A function that can be used in the `define` function when defining
 * a collection of tasks.
 */
export type TaskFunction = (...args: any[]) => Awaitable<any>;

export type Hook = (threadID: number) => Awaitable<void>;

export type HookDefinitions = {
    /**
     * A function which will be automatically called once when a service for
     * the set of definitions is launched. If asynchronous, it will be
     * awaited.
     *
     * Note that the `launchService()` function's promise resolves only after
     * this function has completed.
     *
     * Not supported with regular task calls. Use `__beforeTask` instead.
     */
    __initializeService?: Hook;
    /**
     * A function which will be automatically called before each task function is run.
     *
     * Not supported with services. Use `__beforeServiceTaskCall` instead.
     */
    __beforeTask?: Hook;
    /**
     * A function which will be automatically called after each task function is run.
     *
     * Not supported with services. Use `__afterServiceTaskCall` instead.
     */
    __afterTask?: Hook;
    /**
     * A function which will automatically called before a task is run within a service.
     *
     * Only for usage with services. For regular tasks, use `__beforeTask` instead.
     */
    __beforeServiceTask?: Hook;
    /**
     * A function which will automatically called after a task is run within a service.
     *
     * Only for usage with services. For regular tasks, use `__afterTask` instead.
     */
    __afterServiceTask?: Hook;
};

/**
 * A collection of task functions.
 */
export type TaskDefinitions = Record<string, TaskFunction> & HookDefinitions;

/**
 * A collection of task functions, excluding the `__initializeService` function if present.
 */
export type Tasks<Definitions extends TaskDefinitions> = Except<Definitions, '__initializeService' | '__beforeTask' | '__afterTask'>;

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
    /**
     * Whether or not to prevent services from being launched and tasks from being run
     * from within the same file where their definitions live.
     */
    safeMode?: boolean;
};
