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
     * **Experimental**
     *
     * Automatically re-launch a service if it is terminated or closed for any reason.
     * This includes closing a service manually by using `.close()` or `.closeAll()`.
     */
    autoRenew?: boolean;
};
