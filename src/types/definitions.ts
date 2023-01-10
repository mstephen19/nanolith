import type { Awaitable, Except } from './utilities.js';

type AcceptableValue = string | number | null | undefined | boolean | void | AcceptableValue[];

interface AcceptableObject {
    [key: string | number]: AcceptableObject | AcceptableValue;
}

/**
 * A union of all the data types that can be sent across threads.
 */
export type Acceptable = AcceptableValue | AcceptableObject;

/**
 * A function that can be used in the `define` function when defining
 * a collection of tasks.
 */
export type TaskFunction = (...args: any[]) => Awaitable<any>;

export type InitializeServiceHook = (threadID: number) => Awaitable<void>;

export type TaskHookContext<Keys = string> = {
    /**
     * The name of the task being called.
     */
    name: Keys;
    /**
     * Whether or not the task is being run in a service.
     * If `true`, it's being called within a service.
     * If `false`, it's being called in a standalone one-time worker.
     */
    inService: boolean;
};

export type TaskHook = (context: TaskHookContext) => Awaitable<void>;

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
    __initializeService?: InitializeServiceHook;
    /**
     * A function which will be automatically called before each task function is run.
     */
    __beforeTask?: TaskHook;
    /**
     * A function which will be automatically called after each task function is run.
     */
    __afterTask?: TaskHook;
};

/**
 * A collection of task functions.
 */
export type TaskDefinitions = Record<string, TaskFunction> & HookDefinitions;

/**
 * A collection of task functions, excluding the `__initializeService` function if present.
 */
export type Tasks<Definitions extends TaskDefinitions> = Except<Definitions, keyof HookDefinitions>;

export type DefineOptions = {
    /**
     * If `define()`'s default file location detection is not working correctly,
     * the true file location for the set of definitions can be provided here.
     */
    file?: string;
    /**
     * A unique identifier that can be used when creating multiple sets of definitions
     * in the same file to avoid nasty clashing. Overrides the identifier created by
     * Nanolith.
     */
    identifier?: string;
    /**
     * Whether or not to prevent services from being launched and tasks from being run
     * from within the same file where their definitions live.
     */
    safeMode?: boolean;
};
