import { encodeValue } from '../shared_map/utilities.js';

export enum Bytes {
    /**
     * **1b** - One byte.
     */
    byte = 1,
    /**
     * **1kb** - One kilobyte.
     */
    kilobyte = 1024,
    /**
     * **1mb** - One megabyte.
     */
    megabyte = 1048576,
}

export const NULL_ENCODED = encodeValue(new TextEncoder(), null);

export const ENCODER = new TextEncoder();

export const DECODER = new TextDecoder();
