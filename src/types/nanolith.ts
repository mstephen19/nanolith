import type { TaskDefinitions } from './definitions.js';
import type { CleanKeyOf, CleanReturnType } from './utilities.js';
import type { TaskWorkerOptions, ServiceWorkerOptions } from './workers.js';
import type { Service } from '../service/index.js';

/**
 * The API returned by the `define` function, which allows for the calling of task workers,
 * or the creation of service workers.
 */
export type Nanolith<Definitions extends TaskDefinitions> = {
    /**
     * Spin up a task worker and run a task within it, returning a promise of the value returned
     * by the task function specified.
     */
    <Name extends CleanKeyOf<Definitions>>(options: TaskWorkerOptions<Name, Parameters<Definitions[Name]>>): Promise<
        CleanReturnType<Definitions[Name]>
    >;
    launchService: <Options extends ServiceWorkerOptions>(options?: Options) => Promise<Service<Definitions>>;
    file: string;
};
