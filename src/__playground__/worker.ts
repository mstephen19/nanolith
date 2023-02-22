import { SharedMap, define } from 'nanolith';

export const worker = await define({
    foo<A extends string[]>(...data: A) {
        return '';
    },
});
