/**
 * Allows a function to be async or sync.
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * Removes all `Promise` wrappers from a type.
 */
export type UnPromisify<T> = T extends Promise<infer I> ? UnPromisify<I> : T;

/**
 * Provides the return type of a function while applying the `UnPromisify` utility.
 */
export type CleanReturnType<T extends (...args: any[]) => any> = UnPromisify<ReturnType<T>>;

/**
 * Provides the `keyof` union type of a `Record` with `number | symbol` excluded.
 */
export type CleanKeyOf<T extends Record<any, any>> = Extract<keyof T, string>;
