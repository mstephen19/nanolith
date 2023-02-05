import { api2 } from './worker2.js';

try {
    await api2({ name: 'bar' });
} catch (error) {
    console.log('whoops');
}
