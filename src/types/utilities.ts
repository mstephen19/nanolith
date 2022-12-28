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

type IsEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;

/**
 * Filter out keys from an object.
 */
type Filter<KeyType, ExcludeType> = IsEqual<KeyType, ExcludeType> extends true ? never : KeyType extends ExcludeType ? never : KeyType;

/**
 * Create a type from an object type without certain keys.
 */
export type Except<ObjectType, KeysType extends keyof ObjectType> = {
    [KeyType in keyof ObjectType as Filter<KeyType, KeysType>]: ObjectType[KeyType];
};

/**
 * Ensure a number is a positive whole number.
 */
export type PositiveWholeNumber<Num extends number> = `${Num}` extends `-${string}` | `${string}.${string}` | '0' ? never : Num;
