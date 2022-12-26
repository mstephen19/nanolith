import type { ServiceCluster } from '@service_cluster';
import type { TaskDefinitions, Tasks } from './definitions.js';
import type { CleanKeyOf, CleanReturnType, PositiveWholeNumber } from './utilities.js';
import type { TaskWorkerOptions, ServiceWorkerOptions } from './workers.js';
import type { Service } from '@service';

/**
 * The API returned by the `define` function, which allows for the calling of task workers,
 * or the creation of service workers.
 */
export type Nanolith<Definitions extends TaskDefinitions> = {
    /**
     * Spins up a task worker and runs the specified task within it, returning a promise of the value returned
     * by the task function specified.
     *
     * @param options A {@link TaskWorkerOptions} object
     * @returns A promise of the task function's return value
     *
     * @example
     * const data = await api({
     *     name: 'myTaskFunction',
     *     params: ['foo', 'bar', 123],
     * });
     *
     * console.log(data);
     */
    <Name extends CleanKeyOf<Tasks<Definitions>>>(options: TaskWorkerOptions<Name, Parameters<Definitions[Name]>>): Promise<
        CleanReturnType<Definitions[Name]>
    >;
    /**
     * Spins up a single long-running worker where the task functions defined in the `define` function can be called.
     *
     * @param options A {@link ServiceWorkerOptions} object
     * @returns A promise of a {@link Service} instance. The promise resolves once the worker is online.
     *
     * @example
     * const service = await api.launchService({
     *     exceptionHandler: ({ error }) => {
     *         console.log(error.message);
     *     },
     * });
     *
     * const data = await service.call({
     *     name: 'myTaskFunction',
     *     params: ['foo', 'bar', 123],
     * });
     *
     * console.log(data);
     */
    launchService: <Options extends ServiceWorkerOptions>(options?: Options) => Promise<Service<Definitions>>;
    /**
     * Simultaneously create a cluster and launch a certain number of
     * services on it.
     *
     * @param count The number of services to launch on the cluster.
     * @param options
     */
    clusterize<Count extends number, Options extends ServiceWorkerOptions>(
        count?: PositiveWholeNumber<Count>,
        options?: Options
    ): Promise<ServiceCluster<Definitions>>;
    /**
     * The file location at which the definitions live, and where the worker runs off of.
     */
    file: string;
    /**
     * The unique identifier for the set of definitions.
     */
    identifier: string;
};
