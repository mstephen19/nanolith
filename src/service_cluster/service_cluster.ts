import v4 from 'lite-uuid-v4';
import { pool } from '../pool/index.js';

import type { Nanolith } from '../types/nanolith.js';
import type { Service } from '../service/index.js';
import type { ServiceWorkerOptions } from '../types/workers.js';
import type { TaskDefinitions } from '../types/definitions.js';

type ServiceClusterMap<Definitions extends TaskDefinitions> = {
    [key: string]: {
        service: Service<Definitions>;
        active: number;
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
     * The number of currently active task calls on all services on the cluster.
     */
    get activeServiceCalls() {
        return Object.values(this.#serviceMap).reduce((acc, curr) => acc + curr.active, 0);
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
     */
    addService(service: Service<Definitions>) {
        this.#registerNewService(service);
    }

    #registerNewService(service: Service<Definitions>) {
        const identifier = v4();
        this.#serviceMap[identifier] = { service, active: 0, identifier };

        // When the service is terminated, remove it from the service map.
        service.on('terminated', () => {
            delete this.#serviceMap[identifier];
        });

        // Increment the service's active count when it makes a call.
        service.on('calling', () => {
            this.#serviceMap[identifier].active++;
        });

        // Decrement the service's active count when it finishes making a call.
        service.on('called', () => {
            this.#serviceMap[identifier].active--;
        });
    }

    /**
     *
     * @returns The {@link Service} instance on the cluster that is currently the least active.
     * If no services are active, an error will be thrown.
     */
    use() {
        const values = Object.values(this.#serviceMap);

        if (!values.length) throw new Error('No running services found on this ServiceCluster!');

        if (values.length === 1) return values[0].service;

        return values.reduce((acc, curr) => {
            if (curr.active < acc.active) return curr;
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
}
