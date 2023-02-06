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
     */
    autoRenew?: boolean;
};
