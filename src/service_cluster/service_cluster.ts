import { randomUUID as v4 } from 'crypto';
import { pool } from '../pool/index.js';

import type { Nanolith } from '../types/nanolith.js';
import type { Service } from '../service/index.js';
import type { ServiceWorkerOptions } from '../types/workers.js';
import type { TaskDefinitions } from '../types/definitions.js';

type ServiceClusterMap<Definitions extends TaskDefinitions> = {
    [key: string]: {
        service: Service<Definitions>;
        identifier: string;
    };
};

/**
 * A lightweight API for managing multiple services using the same set
 * of task definitions.
 */
export class ServiceCluster<Definitions extends TaskDefinitions> {
    #nanolith: Nanolith<Definitions>;
    #serviceMap: ServiceClusterMap<Definitions> = {};

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
        return Object.values(this.#serviceMap).length;
    }

    /**
     * An array of objects for each active service on the cluster. Each object contains the `service`,
     * its current `active` count, and its unique `identifier`.
     */
    get currentServices() {
        return Object.freeze(Object.values(this.#serviceMap));
    }

    /**
     * The number of currently active task calls on all services on the cluster.
     */
    get activeServiceCalls() {
        return Object.values(this.#serviceMap).reduce((acc, curr) => acc + curr.service.activeCalls, 0);
    }

    /**
     * Launch a new service on the provided {@link Nanolith} API, and automatically manage it
     * with the `ServiceCluster`.
     *
     * @param options A {@link ServiceWorkerOptions} object
     * @returns A promise of a {@link Service} instance. The promise resolves once the worker is online.
     *
     * @example
     * const cluster = new ServiceCluster(api);
     *
     * await cluster.launchService({ priority: true });
     * await cluster.launchService({ priority: true });
     */
    async launchService<Options extends ServiceWorkerOptions>(options = {} as Options) {
        // Don't allow more services to be added if it exceeds the pool's max concurrency
        if (Object.values(this.#serviceMap).length >= pool.maxConcurrency) return;

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
        this.#serviceMap[identifier] = { service, identifier };

        // When the service is terminated, remove it from the service map.
        service.on('terminated', () => {
            delete this.#serviceMap[identifier];
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
        if (typeof identifier === 'string' && identifier in this.#serviceMap) {
            return this.#serviceMap[identifier];
        }

        // Default behavior - find the least active service.
        const values = Object.values(this.#serviceMap);
        if (!values.length) throw new Error('No running services found on this ServiceCluster!');

        if (values.length === 1) return values[0].service;

        return values.reduce((acc, curr) => {
            if (curr.service.activeCalls < acc.service.activeCalls) return curr;
            return acc;
        }, values[0]).service;
    }

    /**
     * Runs the `.close()` method on all `Service` instances on the cluster.
     */
    closeAll() {
        const promises = Object.values(this.#serviceMap).map(({ service }) => service.close());
        return Promise.all(promises);
    }

    /**
     * Runs the `.close()` method on all `Service` instances on the cluster which are currently not running
     * any tasks.
     */
    closeAllIdle() {
        const promises = Object.values(this.#serviceMap).map(({ service }) => (service.activeCalls <= 0 ? service.close() : null));
        return Promise.all(promises);
    }
}
