import type { TaskDefinitions } from '@typing/definitions.js';
import type { Service } from '@service';

export type ServiceClusterMap<Definitions extends TaskDefinitions> = Map<
    string,
    {
        service: Service<Definitions>;
        identifier: string;
    }
>;

export type ServiceClusterOptions = {
    /**
     * Automatically re-launch a service if its process ends with a non-zero
     * exit code.
     *
     * @example
     * // Launch five services on a cluster
     * const cluster = nanolith.clusterize(5, {
     *     cluster: {
     *         // Enable auto-renewal
     *         autoRenew: true,
     *     },
     * });
     *
     * await cluster.use().close(1);
     *
     * // Allow some time for the cluster to re-launch a service
     * await new Promise((r) => setTimeout(r, 2e3));
     *
     * console.log(cluster.activeServices); // -> 5
     */
    autoRenew?: boolean;
};
