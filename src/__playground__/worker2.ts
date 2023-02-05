import { define } from 'nanolith';
import { api } from './worker.js';

export const api2 = await define({
    async bar() {
        try {
            await api({ name: 'foo' });
        } catch (error) {
            throw error;
        }
    },
});
