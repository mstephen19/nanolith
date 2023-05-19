import { encodeValue } from '../shared_map/utilities.js';

export const enum LockStatus {
    Unlocked,
    Locked,
}

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

export const ENCODER = new TextEncoder();

export const DECODER = new TextDecoder();

// Using a constant because the representation of null in
// SharedMap may change in the future.
export const NULL = null;

export const NULL_ENCODED = encodeValue(ENCODER, NULL);
