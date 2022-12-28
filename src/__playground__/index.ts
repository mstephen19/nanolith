// 💡 index.ts
import { SharedMap } from 'nanolith';

// Initialize a new SharedMap that has a key of "foo"
const countMap = new SharedMap({ count: 1 });

countMap.set('count', (prev) => {
    return +prev + 1;
});

// Close the mutex orchestrator (only necessary on the
// thread where the SharedMap was first instantiated).
countMap.close();
