/**
 * Language-native facade injected by Graaly.
 *
 * Keep this file next to TypeScript plugin sources. It compiles to the tiny
 * runtime module that exposes the global SDK, while also providing editor and
 * compiler types without requiring the Minecraft server JAR in a Node project.
 */

import type { ApiClass, ApiType, ApiObject, NativeRandom } from "./base.mts";
import type {
    AttributesNamespace,
    BiomesNamespace,
    ConstantsApi,
    DifficultiesNamespace,
    DyeColorsNamespace,
    EnchantmentsNamespace,
    EntityTypeOf,
    EntityTypesNamespace,
    GameModesNamespace,
    MaterialsNamespace,
    ParticlesNamespace,
    PotionEffectsNamespace,
    SoundsNamespace,
    WorldEnvironmentsNamespace,
    WorldTypesNamespace,
} from "./constants.mts";
import type {
    Attribute,
    AttributeInstance,
    BiomeGrid,
    BlockPopulator,
    BukkitTask,
    Cancellable,
    Chunk,
    ChunkData,
    ChunkGenerator,
    CommandSender,
    Entity,
    EntityType,
    Event,
    JavaPlugin,
    Location,
    Player,
    Server,
    World,
    WorldEnvironment,
    WorldType,
} from "./generated-api.mts";

export type { ApiClass, ApiType, ApiObject } from "./base.mts";

export type EventPriority = "LOWEST" | "LOW" | "NORMAL" | "HIGH" | "HIGHEST" | "MONITOR";

export type CancellableEvent = Event & Cancellable;
export type TaskHandle = BukkitTask;

export type RandomSource = NativeRandom;
export type WorldGenerator = ChunkGenerator;

export interface WorldGenerationContext {
    readonly world: World;
    readonly random: RandomSource;
    readonly chunkX: number;
    readonly chunkZ: number;
    readonly biomes: BiomeGrid;
    readonly chunk: ChunkData;
}

export interface WorldSpawnContext {
    readonly world: World;
    readonly x: number;
    readonly z: number;
}

export interface WorldFixedSpawnContext {
    readonly world: World;
    readonly random: RandomSource;
}

export interface WorldPopulateContext {
    readonly world: World;
    readonly random: RandomSource;
    readonly chunk: Chunk;
}

export interface WorldGeneratorOptions {
    generate(context: WorldGenerationContext): ChunkData | void;
    canSpawn?(context: WorldSpawnContext): boolean;
    defaultPopulators?: Iterable<BlockPopulator> | ((world: World) => Iterable<BlockPopulator> | null);
    fixedSpawn?(context: WorldFixedSpawnContext): Location | null;
}

export type WorldEnvironmentName = "NORMAL" | "NETHER" | "THE_END";
export type WorldKind = "NORMAL" | "FLAT" | "VERSION_1_1" | "LARGE_BIOMES" | "AMPLIFIED" | "CUSTOMIZED";

export interface WorldCreateOptions {
    seed?: number;
    environment?: WorldEnvironmentName | WorldEnvironment;
    type?: WorldKind | WorldType;
    generateStructures?: boolean;
    generatorSettings?: string;
    generator?: WorldGenerator;
}

export interface EventOptions {
    priority?: EventPriority;
    ignoreCancelled?: boolean;
}

export type PacketDirection = "receive" | "send";
export type PacketListenerPriority = EventPriority;

export interface PacketType extends ApiObject {
    readonly name: string;
}

export interface PacketEvent extends ApiObject {
    readonly packetType: PacketType;
    readonly packetName: string;
    readonly user: unknown;
    readonly player: Player | null;
    readonly clientVersion: unknown;
    cancelled: boolean;
    markForReEncode(reencode: boolean): void;
}

export interface PacketContext<E extends PacketEvent = PacketEvent> {
    readonly direction: PacketDirection;
    readonly packetType: PacketType;
    readonly packetName: string;
    readonly user: unknown;
    readonly player: Player | null;
    readonly clientVersion: unknown;
    isCancelled(): boolean;
    cancel(cancelled?: boolean): void;
    reencode(): void;
    wrap<T = unknown>(wrapperType: ApiType<T> | ApiClass<T>): T;
}

export interface PacketListenerOptions {
    priority?: PacketListenerPriority;
}

export interface PacketSendOptions {
    silent?: boolean;
}

export interface PacketWrapper extends ApiObject {
    readonly packetType: PacketType;
    readonly user: unknown;
    readonly player: Player | null;
}

export interface PacketWrapperType<T extends PacketWrapper = PacketWrapper> extends ApiType<T> {
    (...args: unknown[]): T;
    new (...args: unknown[]): T;
}

export interface PacketNamespace {
    readonly [constant: string]: PacketType | PacketNamespace;
}

/**
 * PacketEvents consumes cancellation and wrapper changes before this function
 * returns. `undefined` deliberately rejects `async` functions at type-check
 * time while allowing an ordinary callback with no return statement.
 */
export type SynchronousPacketCallback<E extends PacketEvent = PacketEvent> =
    (context: PacketContext<E>) => undefined;

export interface PacketsApi {
    readonly available: boolean;
    readonly version: string | null;
    readonly PacketType: PacketNamespace;
    readonly Client: PacketNamespace;
    readonly Server: PacketNamespace;
    create<T extends PacketWrapper>(wrapperType: PacketWrapperType<T> | ApiClass<T>, ...args: unknown[]): T;
    wrap<T extends PacketWrapper>(wrapperType: PacketWrapperType<T> | ApiClass<T>, event: PacketContext | PacketEvent): T;
    onReceive<E extends PacketEvent = PacketEvent>(
        packetType: PacketType | null,
        /** Must finish synchronously. Start follow-up async work without returning its Promise. */
        callback: SynchronousPacketCallback<E>,
        options?: PacketListenerOptions,
    ): SynchronousPacketCallback<E>;
    onReceive<E extends PacketEvent = PacketEvent>(
        /** Must finish synchronously. Start follow-up async work without returning its Promise. */
        callback: SynchronousPacketCallback<E>,
        options?: PacketListenerOptions,
    ): SynchronousPacketCallback<E>;
    listenReceive<E extends PacketEvent = PacketEvent>(packetType?: PacketType | null, options?: PacketListenerOptions):
        (callback: SynchronousPacketCallback<E>) => SynchronousPacketCallback<E>;
    onSend<E extends PacketEvent = PacketEvent>(
        packetType: PacketType | null,
        /** Must finish synchronously. Start follow-up async work without returning its Promise. */
        callback: SynchronousPacketCallback<E>,
        options?: PacketListenerOptions,
    ): SynchronousPacketCallback<E>;
    onSend<E extends PacketEvent = PacketEvent>(
        /** Must finish synchronously. Start follow-up async work without returning its Promise. */
        callback: SynchronousPacketCallback<E>,
        options?: PacketListenerOptions,
    ): SynchronousPacketCallback<E>;
    listenSend<E extends PacketEvent = PacketEvent>(packetType?: PacketType | null, options?: PacketListenerOptions):
        (callback: SynchronousPacketCallback<E>) => SynchronousPacketCallback<E>;
    send(player: Player | unknown, packet: unknown, options?: PacketSendOptions): void;
    sendToAll(packet: unknown, options?: PacketSendOptions): void;
    receive(player: Player | unknown, packet: unknown, options?: PacketSendOptions): void;
    user(player: Player | unknown): unknown;
    clientVersion(player: Player | unknown): unknown;
    ping(player: Player | unknown): number;
}

export interface CommandContext {
    readonly sender: CommandSender;
    readonly command: unknown;
    readonly label: string;
    readonly args: string[];
    reply(message: unknown): void;
    hasPermission(permission: string): boolean;
}

export interface EventsApi {
    on<T>(eventType: ApiType<T> | ApiClass<T>, callback: (event: T) => unknown, options?: EventOptions): (event: T) => unknown;
    listen<T>(eventType: ApiType<T> | ApiClass<T>, options?: EventOptions):
        (callback: (event: T) => unknown) => (event: T) => unknown;
}

export interface CommandsApi {
    on(name: string, callback: (context: CommandContext) => boolean | void): (context: CommandContext) => boolean | void;
    handle(name: string): (callback: (context: CommandContext) => boolean | void) => typeof callback;
    complete(name: string, callback: (context: CommandContext) => Iterable<string> | null): typeof callback;
    completer(name: string): (callback: (context: CommandContext) => Iterable<string> | null) => typeof callback;
    dispatch(sender: CommandSender, commandLine: string): boolean;
}

export interface TasksApi {
    ticks(seconds: number): number;
    run(callback: () => unknown): TaskHandle;
    later(delay: number, callback: () => unknown): TaskHandle;
    repeat(delay: number, period: number, callback: () => unknown): TaskHandle;
    runAsync(callback: () => unknown): TaskHandle;
    laterAsync(delay: number, callback: () => unknown): TaskHandle;
    repeatAsync(delay: number, period: number, callback: () => unknown): TaskHandle;
    cancel(task: TaskHandle | number): void;
    delay(ticks?: number): Promise<void>;
    sleep(seconds: number): Promise<void>;
}

export interface ConfigApi {
    get<T = unknown>(path: string, fallback?: T): T;
    set(path: string, value: unknown): void;
    contains(path: string): boolean;
    save(): void;
    reload(): void;
}

export interface PlayersApi extends Iterable<Player> {
    online(): Player[];
    get(name: string): Player | null;
    exact(name: string): Player | null;
    isPlayer(value: unknown): value is Player;
    broadcast(message: unknown): void;
}

export interface BoardMessage<T = unknown> {
    readonly board: string;
    readonly session: string;
    readonly type: string;
    readonly player: {
        readonly id?: string;
        readonly name?: string;
    };
    readonly data: T;
}

export interface BoardsApi {
    readonly available: boolean;
    state(board: string, viewer: Player, data?: Record<string, unknown>): void;
    onMessage<T = unknown>(
        board: string,
        callback: (message: BoardMessage<T>) => unknown,
    ): (message: BoardMessage<T>) => unknown;
    listen<T = unknown>(board: string): (
        callback: (message: BoardMessage<T>) => unknown,
    ) => (message: BoardMessage<T>) => unknown;
    refresh(board: string, viewer: Player): void;
}

export interface HttpRequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Record<string, unknown> | readonly unknown[];
    timeout?: number;
    /** Cancels the underlying Java HttpClient future when aborted. */
    signal?: AbortSignalLike;
}

/** Structural subset shared by browser AbortSignal and Graaly's server host. */
export interface AbortSignalLike {
    readonly aborted: boolean;
    readonly reason?: unknown;
    addEventListener(type: "abort", listener: () => void, options?: { once?: boolean }): void;
    removeEventListener(type: "abort", listener: () => void): void;
    throwIfAborted?(): void;
}

export interface HttpResponse {
    readonly status: number;
    readonly ok: boolean;
    readonly headers: Readonly<Record<string, readonly string[]>>;
    readonly body: string;
    text(): Promise<string>;
    json<T = unknown>(): Promise<T>;
}

export interface HttpApi {
    request(url: string, options?: HttpRequestOptions): Promise<HttpResponse>;
    get(url: string, options?: Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse>;
    post(url: string, body?: HttpRequestOptions["body"], options?: Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse>;
    put(url: string, body?: HttpRequestOptions["body"], options?: Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse>;
    delete(url: string, options?: Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse>;
}

export type WebSocketReadyState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

export interface WebSocketMessageEvent {
    readonly type: "message";
    readonly connectionId: string;
    readonly data: string;
}

export interface WebSocketBinaryEvent {
    readonly type: "binary";
    readonly connectionId: string;
    /** Base64-encoded frame contents; no Java ByteBuffer leaks into plugin code. */
    readonly data: string;
    readonly last: boolean;
}

export interface WebSocketCloseEvent {
    readonly type: "close";
    readonly connectionId: string;
    readonly code: number;
    readonly reason: string;
}

export interface WebSocketErrorEvent {
    readonly type: "error";
    readonly connectionId: string;
    readonly error: Error;
}

export interface WebSocketConnection {
    readonly id: string;
    readonly readyState: WebSocketReadyState;
    on(type: "open", listener: (event: { readonly type: "open"; readonly connectionId: string }) => unknown): () => void;
    on(type: "message", listener: (event: WebSocketMessageEvent) => unknown): () => void;
    on(type: "binary", listener: (event: WebSocketBinaryEvent) => unknown): () => void;
    on(type: "close", listener: (event: WebSocketCloseEvent) => unknown): () => void;
    on(type: "error", listener: (event: WebSocketErrorEvent) => unknown): () => void;
    onMessage(listener: (data: string, event: WebSocketMessageEvent) => unknown): () => void;
    onBinary(listener: (base64: string, last: boolean, event: WebSocketBinaryEvent) => unknown): () => void;
    onClose(listener: (event: WebSocketCloseEvent) => unknown): () => void;
    onError(listener: (event: WebSocketErrorEvent) => unknown): () => void;
    send(data: string): Promise<void>;
    sendJson(value: unknown): Promise<void>;
    close(code?: number, reason?: string): Promise<void>;
}

export interface WebSocketApi {
    connect(
        url: string,
        options?: { headers?: Record<string, string>; timeout?: number },
    ): Promise<WebSocketConnection>;
}

export interface UiAction {
    readonly type: "inventory.click" | "inventory.close" | "input.submit" | "input.cancel" | string;
    readonly viewId?: string;
    readonly actionId?: string;
    readonly slot?: number;
    readonly click?: string;
    readonly shift?: boolean;
    readonly right?: boolean;
    readonly value?: string;
    readonly player: {
        readonly id: string;
        readonly name: string;
    };
}

export interface UiApi {
    render(player: Player, snapshot: Readonly<Record<string, unknown>>, onAction?: (action: UiAction) => unknown): void;
    clear(player: Player): void;
    dismiss(player: Player, surface: "inventory" | "scoreboard" | "bossBar" | "tab" | "input"): void;
}

export interface WorldsApi extends Iterable<World> {
    all(): World[];
    get(name: string): World | null;
    /** Create a typed location without accessing a host class path. */
    location(world: World, x: number, y: number, z: number, yaw?: number, pitch?: number): Location;
    create(name: string, options?: WorldCreateOptions): World;
    generator(callback: (context: WorldGenerationContext) => void): WorldGenerator;
    generator(options: WorldGeneratorOptions): WorldGenerator;
    populator(callback: (context: WorldPopulateContext) => void): BlockPopulator;
    unload(worldOrName: World | string, save?: boolean): boolean;
}

export interface EntitySpawnOptions {
    readonly name?: string | null;
    readonly customName?: string | null;
    readonly nameVisible?: boolean;
    readonly customNameVisible?: boolean;
    readonly attributes?: Readonly<Record<string, number>>;
    readonly ai?: boolean;
    readonly invulnerable?: boolean;
    readonly gravity?: boolean;
    readonly glowing?: boolean;
}

export interface EntitiesApi {
    type(name: string): EntityType;
    attributeType(name: string): Attribute;
    spawn<T extends Entity>(location: Location, type: EntityTypeOf<T>, options?: EntitySpawnOptions): T;
    spawn(location: Location, type: string | EntityType, options?: EntitySpawnOptions): Entity;
    configure<T extends Entity>(entity: T, options?: EntitySpawnOptions): T;
    attribute(entity: Entity, name: string | Attribute, baseValue?: number): AttributeInstance;
    remove(entity: Entity): void;
}

export interface SdkDiagnosticsReport {
    readonly apiSymbols: number;
    readonly wrappers: number;
    readonly packetTypes: number;
    readonly packetConstants: number;
}

export interface DiagnosticsApi {
    /** Resolve every generated symbol and return the runtime catalog sizes. */
    verify(): SdkDiagnosticsReport;
}

export interface CompatibilityApi {
    /** Version of the stable Graaly language contract. */
    readonly contractVersion: string;
    /** Earliest supported plugin-server release. */
    readonly minimumGameVersion: string;
    /** Exact game version detected by Graaly, for diagnostics rather than branching normal code. */
    readonly minecraftVersion: string;
    readonly serverVersion: string;
    supports(feature: string): boolean;
    /** Throw a GraalyUnsupportedFeature error with a useful version explanation. */
    require(feature: string): void;
    typeAvailable(exportedType: string): boolean;
    /** Resolve a canonical material name through the active version adapter. */
    material(name: string): import("./generated-api.mts").Material;
}

export interface GraalyUnsupportedFeatureError extends Error {
    readonly name: "GraalyUnsupportedFeature";
    readonly feature: string | null;
    readonly minecraftVersion: string | null;
}

export interface GraalyUnsupportedFeatureConstructor {
    new(message: unknown, feature?: string | null, minecraftVersion?: string | null): GraalyUnsupportedFeatureError;
}

export type ExtensionHandlers<T> = Partial<{
    [K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never]: T[K];
}>;

export interface AdaptersApi {
    extend<T>(type: ApiClass<T>, handlers: ExtensionHandlers<T>, ...constructorArgs: unknown[]): T;
    implement<T>(type: ApiClass<T>, handlers: ExtensionHandlers<T>): T;
}

interface GraalyGlobals {
    readonly plugin: JavaPlugin;
    readonly server: Server;
    readonly logger: unknown;
    readonly dataFolder: unknown;
    dataFile(path: string): unknown;
    readonly events: EventsApi;
    readonly commands: CommandsApi;
    readonly tasks: TasksApi;
    readonly http: HttpApi;
    readonly websocket: WebSocketApi;
    readonly ui: UiApi;
    readonly config: ConfigApi;
    readonly players: PlayersApi;
    readonly boards: BoardsApi;
    readonly worlds: WorldsApi;
    readonly entities: EntitiesApi;
    readonly compatibility: CompatibilityApi;
    readonly diagnostics: DiagnosticsApi;
    readonly constants: ConstantsApi;
    readonly Materials: MaterialsNamespace;
    readonly Sounds: SoundsNamespace;
    readonly Particles: ParticlesNamespace;
    readonly DyeColors: DyeColorsNamespace;
    readonly EntityTypes: EntityTypesNamespace;
    readonly Attributes: AttributesNamespace;
    readonly GameModes: GameModesNamespace;
    readonly Difficulties: DifficultiesNamespace;
    readonly WorldEnvironments: WorldEnvironmentsNamespace;
    readonly WorldTypes: WorldTypesNamespace;
    readonly Biomes: BiomesNamespace;
    readonly PotionEffects: PotionEffectsNamespace;
    readonly Enchantments: EnchantmentsNamespace;
    readonly GraalyUnsupportedFeature: GraalyUnsupportedFeatureConstructor;
    readonly adapters: AdaptersApi;
    readonly text: { color(message: unknown): string };
    readonly packets: PacketsApi;
    readonly PacketType: PacketNamespace;
    readonly ClientPacket: PacketNamespace;
    readonly ServerPacket: PacketNamespace;
    info(message: unknown): void;
    warn(message: unknown): void;
    error(message: unknown): void;
}

declare global {
    var plugin: JavaPlugin;
    var server: Server;
    var logger: unknown;
    var dataFolder: unknown;
    var events: EventsApi;
    var commands: CommandsApi;
    var tasks: TasksApi;
    var http: HttpApi;
    var websocket: WebSocketApi;
    var ui: UiApi;
    var config: ConfigApi;
    var players: PlayersApi;
    var boards: BoardsApi;
    var worlds: WorldsApi;
    var entities: EntitiesApi;
    var compatibility: CompatibilityApi;
    var diagnostics: DiagnosticsApi;
    var constants: ConstantsApi;
    var Materials: MaterialsNamespace;
    var Sounds: SoundsNamespace;
    var Particles: ParticlesNamespace;
    var DyeColors: DyeColorsNamespace;
    var EntityTypes: EntityTypesNamespace;
    var Attributes: AttributesNamespace;
    var GameModes: GameModesNamespace;
    var Difficulties: DifficultiesNamespace;
    var WorldEnvironments: WorldEnvironmentsNamespace;
    var WorldTypes: WorldTypesNamespace;
    var Biomes: BiomesNamespace;
    var PotionEffects: PotionEffectsNamespace;
    var Enchantments: EnchantmentsNamespace;
    var GraalyUnsupportedFeature: GraalyUnsupportedFeatureConstructor;
    var adapters: AdaptersApi;
    var text: { color(message: unknown): string };
    var packets: PacketsApi;
    var dataFile: (path: string) => unknown;
    var info: (message: unknown) => void;
    var warn: (message: unknown) => void;
    var error: (message: unknown) => void;
}

const runtime = globalThis as unknown as GraalyGlobals;

export const plugin = runtime.plugin;
export const server = runtime.server;
export const logger = runtime.logger;
export const dataFolder = runtime.dataFolder;
export const events = runtime.events;
export const commands = runtime.commands;
export const tasks = runtime.tasks;
export const http = runtime.http;
export const websocket = runtime.websocket;
export const ui = runtime.ui;
export const config = runtime.config;
export const players = runtime.players;
export const boards = runtime.boards;
export const worlds = runtime.worlds;
export const entities = runtime.entities;
export const compatibility = runtime.compatibility;
export const diagnostics = runtime.diagnostics;
export const constants = runtime.constants;
export const Materials = runtime.Materials;
export const Sounds = runtime.Sounds;
export const Particles = runtime.Particles;
export const DyeColors = runtime.DyeColors;
export const EntityTypes = runtime.EntityTypes;
export const Attributes = runtime.Attributes;
export const GameModes = runtime.GameModes;
export const Difficulties = runtime.Difficulties;
export const WorldEnvironments = runtime.WorldEnvironments;
export const WorldTypes = runtime.WorldTypes;
export const Biomes = runtime.Biomes;
export const PotionEffects = runtime.PotionEffects;
export const Enchantments = runtime.Enchantments;
export const GraalyUnsupportedFeature = runtime.GraalyUnsupportedFeature;
export const adapters = runtime.adapters;
export const dataFile = runtime.dataFile;
export const text = runtime.text;
export const packets = runtime.packets;
export const info = runtime.info;
export const warn = runtime.warn;
export const error = runtime.error;

export * from "./generated-api.mts";
export type * from "./constants.mts";
export * from "./generated-packets.mts";
