/** Shared type-only primitives used by the generated Graaly SDK. */

export interface ApiObject {
    /** Type-only marker for an object adapted to the TypeScript API surface. */
    readonly __graalyApiObject?: never;
}

export interface NativeFuture<T = unknown> extends ApiObject {
    cancel(mayInterruptIfRunning?: boolean): boolean;
    readonly cancelled: boolean;
    readonly done: boolean;
    get(): T;
}

export interface NativeRandom extends ApiObject {
    nextInt(bound?: number): number;
    nextLong(): number;
    nextFloat(): number;
    nextDouble(): number;
    nextBoolean(): boolean;
}

export interface NativeUuid extends ApiObject {
    toString(): string;
}

/** A filesystem value returned by the server, with a JavaScript-shaped surface. */
export interface NativePath extends ApiObject {
    readonly name: string;
    readonly path: string;
    readonly absolutePath: string;
    exists(): boolean;
    isFile(): boolean;
    isDirectory(): boolean;
    toString(): string;
}

export interface NativeDate extends ApiObject {
    readonly time: number;
    before(other: NativeDate): boolean;
    after(other: NativeDate): boolean;
    toString(): string;
}

export interface NativeLogger extends ApiObject {
    info(message: string): void;
    warning(message: string): void;
    severe(message: string): void;
}

export interface NativeThread extends ApiObject {
    readonly name: string;
    readonly alive: boolean;
    interrupt(): void;
}

export interface ApiClass<T = unknown> {
    /** Phantom member used only to preserve the represented API type. */
    readonly __graalyType?: T;
}

/** A discoverable, callable SDK symbol such as Material or Location. */
export interface ApiType<T = unknown> extends ApiClass<T> {
    (...args: unknown[]): T;
    new (...args: unknown[]): T;
}
