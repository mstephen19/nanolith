import { define } from 'nanolith';

export const worker = await define({
    __initializeService() {
        console.log('Initialized');
    },
});
