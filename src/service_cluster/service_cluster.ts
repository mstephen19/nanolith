import { randomUUID as v4 } from 'crypto';
import { pool } from '@pool';
import { Service } from '@service';
import { WorkerExitCode } from '@constants/workers.js';

import type { TransferListItem } from 'worker_threads';
import type { Nanolith } from '@typing/nanolith.js';
import type { ServiceWorkerOptions } from '@typing/workers.js';
import type { TaskDefinitions } from '@typing/definitions.js';
import type { PositiveWholeNumber } from '@typing/utilities.js';
import type { ServiceClusterMap, ServiceClusterOptions } from '@typing/service_cluster.js';

/**
 * A lightweight API for managing multiple services using the same set
 * of task definitions and the same launch options.
 */
export class ServiceCluster<Definitions extends TaskDefinitions> {
    #nanolith: Nanolith<Definitions>;
    #serviceMap: ServiceClusterMap<Definitions> = new Map();
    #autoRenew = false;

    /**
     * @param nanolith An instance of {@link Nanolith} API, returned by the `define()` function.
     */
    constructor(nanolith: Nanolith<Definitions>, options?: ServiceClusterOptions) {
        this.#autoRenew = !!options?.autoRenew;
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
     * @param count The number of services to launch on the cluster.
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
    // async launch<Count extends number, Options extends ServiceWorkerOptions>(count?: 1, options?: Options): Promise<Service<Definitions> | undefined>;
    // async launch<Count extends number, Options extends ServiceWorkerOptions>(
    //     count: Exclude<number, 1 | 2>,
    //     options?: Options
    // ): Promise<(Service<Definitions> | undefined)[]>;
    async launch<Options extends ServiceWorkerOptions>(count?: 1, options?: Options): Promise<[Service<Definitions> | undefined]>;
    async launch<Count extends number, Options extends ServiceWorkerOptions>(
        count: PositiveWholeNumber<Count>,
        options?: Options
    ): Promise<(Service<Definitions> | undefined)[]>;
    async launch<Count extends number, Options extends ServiceWorkerOptions>(count?: PositiveWholeNumber<Count>, options = {} as Options) {
        // Don't allow more services to be added if it exceeds the pool's `maxConcurrency`
        if (!count || count === 1) return [await this.#launchService(options)];

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
     * Add an already running service to the cluster.
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
        if (!(service instanceof Service)) {
            throw new Error('Can only provide Service instances to .addService().');
        }

        this.#registerNewService(service);
    }

    #registerNewService(service: Service<Definitions>) {
        const identifier = v4();
        this.#serviceMap.set(identifier, { service, identifier });

        // When the service is terminated, remove it from the service map.
        service.once('terminated', async (code) => {
            this.#serviceMap.delete(identifier);

            // Automatically relaunch the service if auto-renewal is enabled
            if (this.#autoRenew && code !== WorkerExitCode.Ok) await this.launch(1);
        });
    }

    /**
     * @param identifier A unique identifier for a specific service on the cluster. Retrievable via
     * `cluster.currentServices`
     *
     * @returns The {@link Service} instance on the cluster that has the specified identifier. If
     * a service with the identifier is not found, the default behavior will be used.
     */
    use(identifier: string): Service<Definitions>;
    /**
     * @returns The {@link Service} instance on the cluster that is currently the least active.
     * If no services are active, an error will be thrown.
     */
    use(): Service<Definitions>;
    /**
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

        if (!this.#serviceMap.size) throw new Error('No running services found on this ServiceCluster!');

        // Default behavior - find the least active service.
        const values = [...this.#serviceMap.values()];
        // Don't bother looping at all if there's just one service running on the cluster
        if (values.length === 1) return values[0].service;

        // Retrieve and return the least busy service in the map
        return values.reduce((acc, curr) => {
            if (curr.service.activeCalls < acc.service.activeCalls) return curr;
            return acc;
        }, values[0]).service;
    }

    /**
     * Send the same message to all services on the cluster.
     *
     * @param data The data to send to the service.
     * @param transferList An optional array of {@link TransferListItem}s. See the
     * [Node.js documentation](https://nodejs.org/api/worker_threads.html#workerpostmessagevalue-transferlist) for more information.
     *
     * @example
     * await cluster.launch(4);
     * // All four services launched will be sent the message of "foo"
     * cluster.notifyAll('foo');
     */
    notifyAll<Data = any>(data: Data, transferList?: readonly TransferListItem[]) {
        this.#serviceMap.forEach(({ service }) => {
            service.sendMessage(data, transferList);
        });
    }

    /**
     * Close all active services on the cluster.
     */
    closeAll() {
        const promises = [...this.#serviceMap.values()].map(({ service }) => service.close());
        return Promise.all(promises);
    }

    /**
     * Close all service instances on the cluster that are currently doing nothing (not running any tasks).
     */
    closeAllIdle() {
        const promises = [...this.#serviceMap.values()].reduce((acc, { service }) => {
            if (service.activeCalls <= 0) acc.push(service.close());
            return acc;
        }, [] as Promise<void>[]);

        return Promise.all(promises);
    }
}
