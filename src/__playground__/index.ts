import { ServiceCluster } from '@service_cluster';
import { worker } from './worker.js';

// Spawn multiple concurrent threads
const cluster = new ServiceCluster(worker);
const [x, y] = await cluster.launch(2, {
    exceptionHandler() {
        console.log('oops');
    },
});

x!.onMessage<string>((data) => {
    console.log(data);
});
y!.onMessage<string>((data) => {
    console.log(data);
});

x!.call({ name: 'task' });
y!.call({ name: 'task' });
