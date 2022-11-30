import { randomUUID as v4 } from 'crypto';
import { pool } from '../pool/index.js';

import type { Nanolith } from '../types/nanolith.js';
import type { Service } from '../service/index.js';
import type { ServiceWorkerOptions } from '../types/workers.js';
import type { TaskDefinitions } from '../types/definitions.js';

type ServiceClusterMap<Definitions extends TaskDefinitions> = Map<
    string,
    {
        service: Service<Definitions>;
        identifier: string;
    }
>;

/**
 * A lightweight API for managing multiple services using the same set
 * of task definitions.
 */
export class ServiceCluster<Definitions extends TaskDefinitions> {
    #nanolith: Nanolith<Definitions>;
    #serviceMap: ServiceClusterMap<Definitions> = new Map();

    /**
     *
     * @param nanolith An instance of {@link Nanolith} API, returned by the `define()` function.
     */
    constructor(nanolith: Nanolith<Definitions>) {
        this.#nanolith = nanolith;
    }

    /**
     * The number of currently running services on the cluster.
     */
    get activeServices() {
        return this.#serviceMap.size;
    }

    /**
     * An array of objects for each active service on the cluster. Each object contains the
     * `service` itself, and its unique `identifier` within the cluster.
     */
    get currentServices() {
        return [...this.#serviceMap.values()];
    }

    /**
     * The number of currently active task calls on all services on the cluster.
     */
    get activeServiceCalls() {
        return [...this.#serviceMap.values()].reduce((acc, curr) => acc + curr.service.activeCalls, 0);
    }

    /**
     * Launch a new service on the provided {@link Nanolith} API, and automatically manage it
     * with the `ServiceCluster`.
     *
     * @param options A {@link ServiceWorkerOptions} object
     * @returns A promise of a {@link Service} instance. The promise resolves once the worker is online.
     *
     * **Note:** As a safety measure, if the cluster would exceed the pool's `maxConcurrency`, this
     * function will quietly return `undefined` instead of launching a service.
     *
     * @example
     * const cluster = new ServiceCluster(api);
     *
     * // Launch 2 services on the cluster
     * await cluster.launch(2, { priority: true });
     */
    async launch<Options extends ServiceWorkerOptions>(count?: 1, options?: Options): Promise<Service<Definitions> | undefined>;
    async launch<Options extends ServiceWorkerOptions>(
        count: Exclude<number, 1 | 2>,
        options?: Options
    ): Promise<(Service<Definitions> | undefined)[]>;
    async launch<Options extends ServiceWorkerOptions>(count?: number, options = {} as Options) {
        // Don't allow more services to be added if it exceeds the pool's `maxConcurrency`
        if (!count || count === 1) return this.#launchService(options);

        const promises: Promise<Service<Definitions> | undefined>[] = [];

        for (let i = 1; i <= count; i++) {
            promises.push(this.#launchService(options));
        }

        return Promise.all(promises);
    }

    async #launchService<Options extends ServiceWorkerOptions>(options = {} as Options) {
        // Don't allow more services to be added if it will cause
        // exceeding of the pool's `maxConcurrency`
        if (this.#serviceMap.size >= pool.maxConcurrency) return;

        const service = await this.#nanolith.launchService(options);
        this.#registerNewService(service);

        return service;
    }

    /**
     * Add an already running service to to the cluster.
     *
     * @param service An already running {@link Service}
     *
     * @example
     * const service = await api.launchService();
     * // ... later
     * const cluster = new ServiceCluster(api);
     * cluster.addService(service);
     */
    addService(service: Service<Definitions>) {
        this.#registerNewService(service);
    }

    #registerNewService(service: Service<Definitions>) {
        const identifier = v4();
        this.#serviceMap.set(identifier, { service, identifier });

        // When the service is terminated, remove it from the service map.
        service.once('terminated', () => {
            this.#serviceMap.delete(identifier);
        });
    }

    /**
     *
     * @param identifier A unique identifier for a specific service on the cluster. Retrievable via
     * `cluster.currentServices`
     *
     * @returns The {@link Service} instance on the cluster that has the specified identifier. If
     * a service with the identifier is not found, the default behavior will be used.
     */
    use(identifier: string): Service<Definitions>;
    /**
     *
     * @returns The {@link Service} instance on the cluster that is currently the least active.
     * If no services are active, an error will be thrown.
     */
    use(): Service<Definitions>;
    /**
     *
     * @returns The {@link Service} instance on the cluster that is currently the least active.
     * If no services are active, an error will be thrown. If the `identifier` parameter is provided,
     * the service with the specified identifier will be used if it exists on the cluster (otherwise
     * the default behavior will be used).
     */
    use(identifier?: string) {
        // Handle the case of if the identifier is provided
        if (typeof identifier === 'string' && this.#serviceMap.has(identifier)) {
            return this.#serviceMap.get(identifier);
        }

        // Default behavior - find the least active service.
        const values = [...this.#serviceMap.values()];
        if (!values.length) throw new Error('No running services found on this ServiceCluster!');

        // Don't bother looping at all if there's just one service running on the cluster
        if (values.length === 1) return values[0].service;

        // Retrieve and return the least busy service in the map
        return values.reduce((acc, curr) => {
            if (curr.service.activeCalls < acc.service.activeCalls) return curr;
            return acc;
        }, values[0]).service;
    }

    /**
     * Runs the `.close()` method on all `Service` instances on the cluster.
     */
    closeAll() {
        const promises = [...this.#serviceMap.values()].map(({ service }) => service.close());
        return Promise.all(promises);
    }

    /**
     * Runs the `.close()` method on all `Service` instances on the cluster which are currently not running
     * any tasks.
     */
    closeAllIdle() {
        const promises = [...this.#serviceMap.values()].reduce((acc, { service }) => {
            if (service.activeCalls <= 0) acc.push(service.close());
            return acc;
        }, [] as Promise<void>[]);

        return Promise.all(promises);
    }
}
