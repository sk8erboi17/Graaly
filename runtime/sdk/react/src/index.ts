import React, {
  createContext,
  createElement,
  useCallback,
  useId,
  useState,
  type Ref,
  type ReactNode,
  type ReactPortal,
} from "react";
import ReactReconciler from "react-reconciler";
import { ConcurrentRoot, DefaultEventPriority } from "react-reconciler/constants.js";
import {
  error as reportGraalyError,
  ui,
  type Player,
  type UiAction,
} from "graaly";

declare function setTimeout(callback: (...args: unknown[]) => unknown, milliseconds?: number): number;
declare function clearTimeout(handle: number): void;
declare function queueMicrotask(callback: () => void): void;

const HOST_MESSAGE = "graaly-message";
const HOST_INVENTORY = "graaly-inventory";
const HOST_ITEM = "graaly-item";
const HOST_SCOREBOARD = "graaly-scoreboard";
const HOST_LINE = "graaly-line";
const HOST_BOSS_BAR = "graaly-boss-bar";
const HOST_TAB = "graaly-tab";
const HOST_CHAT_INPUT = "graaly-chat-input";

type HostType =
  | typeof HOST_MESSAGE
  | typeof HOST_INVENTORY
  | typeof HOST_ITEM
  | typeof HOST_SCOREBOARD
  | typeof HOST_LINE
  | typeof HOST_BOSS_BAR
  | typeof HOST_TAB
  | typeof HOST_CHAT_INPUT;

type ActionHandler = (action: UiAction) => unknown;
type HostProps = Record<string, unknown> & { children?: ReactNode };

export type GraalySurface = "inventory" | "scoreboard" | "bossBar" | "tab" | "input";

export interface GraalyUiTransport {
  render(
    player: Player,
    snapshot: Readonly<Record<string, unknown>>,
    onAction?: (action: UiAction) => unknown,
  ): void;
  clear(player: Player): void;
  dismiss?(player: Player, surface: GraalySurface): void;
}

export interface GraalySurfaceHandle<TKind extends GraalySurface = GraalySurface> {
  readonly kind: TKind;
  readonly id: string;
  getProps(): Readonly<Record<string, unknown>>;
  dismiss(): void;
  refresh(): void;
}

export type InventoryHandle = GraalySurfaceHandle<"inventory">;
export type ScoreboardHandle = GraalySurfaceHandle<"scoreboard">;
export type BossBarHandle = GraalySurfaceHandle<"bossBar">;
export type TabHandle = GraalySurfaceHandle<"tab">;
export type ChatInputHandle = GraalySurfaceHandle<"input">;

export interface GraalyCommitOperation {
  readonly kind: "mount" | "update" | "remove";
  readonly path: string;
  readonly previous?: unknown;
  readonly next?: unknown;
}

export interface GraalyCommit {
  readonly sequence: number;
  readonly durationMs: number;
  readonly snapshot: Readonly<Record<string, unknown>>;
  readonly operations: readonly GraalyCommitOperation[];
}

export interface GraalyRootOptions {
  readonly inspect?: (commit: GraalyCommit) => void;
  readonly historyLimit?: number;
  readonly transport?: GraalyUiTransport;
}

interface HostInstance {
  readonly serial: number;
  readonly type: HostType;
  readonly container: GraalyContainer;
  publicInstance: GraalySurfaceHandle | HostInstance;
  props: HostProps;
  children: Array<HostInstance | TextInstance>;
  hidden: boolean;
}

interface TextInstance {
  readonly container: GraalyContainer;
  text: string;
  hidden: boolean;
}

interface GraalyContainer {
  readonly player: Player;
  readonly transport: GraalyUiTransport;
  readonly children: Array<HostInstance | TextInstance>;
  readonly commitListeners: Set<(commit: GraalyCommit) => void>;
  handlers: Map<string, ActionHandler>;
  actionReceiver: (action: UiAction) => void;
  previousSnapshot: Record<string, unknown> | null;
  lastCommit: GraalyCommit | null;
  commitSequence: number;
  commitStartedAt: number;
  history: GraalyCommit[];
  historyLimit: number;
  readonly ownershipKey: string;
  readonly ownershipToken: symbol;
  readonly ownershipGeneration: number;
  suppressTransport: boolean;
  inspect?: (commit: GraalyCommit) => void;
}

export interface MessageProps {
  id?: string;
  channel?: "chat" | "actionbar" | "title";
  subtitle?: string;
  children?: ReactNode;
}

export interface InventoryProps {
  ref?: Ref<InventoryHandle>;
  id?: string;
  title: string;
  rows?: 1 | 2 | 3 | 4 | 5 | 6;
  onClose?: ActionHandler;
  children?: ReactNode;
}

export interface ItemProps {
  slot: number;
  material: string;
  amount?: number;
  durability?: number;
  name?: string;
  lore?: readonly string[];
  onClick?: ActionHandler;
}

export interface ScoreboardProps {
  ref?: Ref<ScoreboardHandle>;
  id?: string;
  title: string;
  children?: ReactNode;
}

export interface LineProps {
  id: string;
  children?: ReactNode;
}

export interface BossBarProps {
  ref?: Ref<BossBarHandle>;
  id?: string;
  progress: number;
  children?: ReactNode;
}

export interface TabProps {
  ref?: Ref<TabHandle>;
  id?: string;
  header?: string;
  footer?: string;
}

export interface ChatInputProps {
  ref?: Ref<ChatInputHandle>;
  id?: string;
  prompt?: string;
  cancelWord?: string;
  open?: boolean;
  defaultOpen?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, action: UiAction) => unknown;
  onSubmit?: (value: string, action: UiAction) => unknown;
  onCancel?: (action: UiAction) => unknown;
}

export function Message({ id, ...props }: MessageProps): React.ReactElement {
  const generatedId = useId();
  return createElement(HOST_MESSAGE, { ...props, id: id ?? generatedId });
}

export function Inventory({ id, ...props }: InventoryProps): React.ReactElement {
  const generatedId = useId();
  return createElement(HOST_INVENTORY, { ...props, id: id ?? generatedId });
}

export function Item(props: ItemProps): React.ReactElement {
  return createElement(HOST_ITEM, props);
}

export function Scoreboard(props: ScoreboardProps): React.ReactElement {
  return createElement(HOST_SCOREBOARD, props);
}

export function Line(props: LineProps): React.ReactElement {
  return createElement(HOST_LINE, props);
}

export function BossBar(props: BossBarProps): React.ReactElement {
  return createElement(HOST_BOSS_BAR, props);
}

export function Tab(props: TabProps): React.ReactElement {
  return createElement(HOST_TAB, props);
}

/**
 * A real controlled/uncontrolled React input backed by the player's next chat
 * message. Controlled callers own `open` and `value`; uncontrolled callers can
 * use `defaultOpen` and `defaultValue` and the component closes after submit.
 */
export function ChatInput({
  id,
  prompt = "Type your answer in chat. Type cancel to stop.",
  cancelWord = "cancel",
  open,
  defaultOpen = true,
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  onCancel,
  ref,
}: ChatInputProps): React.ReactElement | null {
  const generatedId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedOpen = open ?? internalOpen;
  const selectedValue = value ?? internalValue;

  const submit = useCallback((action: UiAction): unknown => {
    const next = String(action.value ?? "");
    if (value === undefined) setInternalValue(next);
    if (open === undefined) setInternalOpen(false);
    const changed = onChange?.(next, action);
    return Promise.resolve(changed).then(() => onSubmit?.(next, action));
  }, [onChange, onSubmit, open, value]);

  const cancel = useCallback((action: UiAction): unknown => {
    if (open === undefined) setInternalOpen(false);
    return onCancel?.(action);
  }, [onCancel, open]);

  if (!selectedOpen) return null;
  return createElement(HOST_CHAT_INPUT, {
    ref,
    id: id ?? generatedId,
    prompt,
    cancelWord,
    value: selectedValue,
    onSubmit: submit,
    onCancel: cancel,
  });
}

let instanceSequence = 1;
let currentPriority = DefaultEventPriority;
const rootHostContext = Object.freeze({ renderer: "graaly" });
const dirtyContainers = new Set<GraalyContainer>();

const markDirty = (container: GraalyContainer): void => {
  if (!dirtyContainers.has(container)) container.commitStartedAt = Date.now();
  dirtyContainers.add(container);
};

const surfaceForHost = (type: HostType): GraalySurface | null => {
  switch (type) {
    case HOST_INVENTORY: return "inventory";
    case HOST_SCOREBOARD: return "scoreboard";
    case HOST_BOSS_BAR: return "bossBar";
    case HOST_TAB: return "tab";
    case HOST_CHAT_INPUT: return "input";
    default: return null;
  }
};

const publicProps = (instance: HostInstance): Readonly<Record<string, unknown>> => {
  const selected: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(instance.props)) {
    if (name === "children" || name.startsWith("on") || typeof value === "function") continue;
    selected[name] = value;
  }
  return Object.freeze(selected);
};

const createPublicInstance = (instance: HostInstance): GraalySurfaceHandle | HostInstance => {
  const surface = surfaceForHost(instance.type);
  if (surface == null) return instance;
  return Object.freeze({
    kind: surface,
    get id() {
      return String(instance.props.id ?? surface);
    },
    getProps: () => publicProps(instance),
    dismiss: () => {
      if (!ownsTransport(instance.container)) return;
      if (instance.container.transport.dismiss == null) {
        throw new Error("This Graaly UI transport does not support dismissing individual surfaces");
      }
      instance.container.transport.dismiss(instance.container.player, surface);
    },
    refresh: () => publish(instance.container),
  }) as GraalySurfaceHandle;
};

const removeExisting = <T>(items: T[], selected: T): void => {
  const index = items.indexOf(selected);
  if (index >= 0) items.splice(index, 1);
};

const insertBefore = <T>(items: T[], selected: T, before: T): void => {
  removeExisting(items, selected);
  const index = items.indexOf(before);
  if (index < 0) items.push(selected);
  else items.splice(index, 0, selected);
};

const hostConfig = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  supportsMicrotasks: true,
  isPrimaryRenderer: true,
  warnsIfNotActing: false,
  noTimeout: -1,
  NotPendingTransition: null,
  HostTransitionContext: createContext(null),
  supportsSingletons: false,
  supportsResources: false,

  getRootHostContext: () => rootHostContext,
  getChildHostContext: (context: typeof rootHostContext) => context,
  getPublicInstance: (instance: HostInstance | TextInstance) =>
    "publicInstance" in instance ? instance.publicInstance : instance,
  prepareForCommit: (container: GraalyContainer) => {
    container.commitStartedAt = Date.now();
    return null;
  },
  preparePortalMount: () => undefined,
  resetAfterCommit: (container: GraalyContainer) => {
    markDirty(container);
    const selected = Array.from(dirtyContainers);
    dirtyContainers.clear();
    for (const dirty of selected) publish(dirty);
  },

  createInstance: (type: HostType, props: HostProps, container: GraalyContainer): HostInstance => {
    const instance: HostInstance = {
      serial: instanceSequence++,
      type,
      container,
      publicInstance: undefined as never,
      props,
      children: [],
      hidden: false,
    };
    instance.publicInstance = createPublicInstance(instance);
    return instance;
  },
  createTextInstance: (text: string, container: GraalyContainer): TextInstance => ({
    container,
    text,
    hidden: false,
  }),
  appendInitialChild: (parent: HostInstance, child: HostInstance | TextInstance) => {
    parent.children.push(child);
  },
  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,

  appendChild: (parent: HostInstance, child: HostInstance | TextInstance) => {
    removeExisting(parent.children, child);
    parent.children.push(child);
    markDirty(parent.container);
  },
  appendChildToContainer: (container: GraalyContainer, child: HostInstance | TextInstance) => {
    removeExisting(container.children, child);
    container.children.push(child);
    markDirty(container);
  },
  insertBefore: (parent: HostInstance, child: HostInstance | TextInstance, before: HostInstance | TextInstance) => {
    insertBefore(parent.children, child, before);
    markDirty(parent.container);
  },
  insertInContainerBefore: (container: GraalyContainer, child: HostInstance | TextInstance, before: HostInstance | TextInstance) => {
    insertBefore(container.children, child, before);
    markDirty(container);
  },
  removeChild: (parent: HostInstance, child: HostInstance | TextInstance) => {
    removeExisting(parent.children, child);
    markDirty(parent.container);
  },
  removeChildFromContainer: (container: GraalyContainer, child: HostInstance | TextInstance) => {
    removeExisting(container.children, child);
    markDirty(container);
  },
  clearContainer: (container: GraalyContainer) => {
    container.children.length = 0;
    markDirty(container);
  },
  commitUpdate: (instance: HostInstance, _type: HostType, _previous: HostProps, next: HostProps) => {
    instance.props = next;
    markDirty(instance.container);
  },
  commitTextUpdate: (instance: TextInstance, _previous: string, next: string) => {
    instance.text = next;
    markDirty(instance.container);
  },
  resetTextContent: (instance: HostInstance) => {
    instance.children.length = 0;
    markDirty(instance.container);
  },
  hideInstance: (instance: HostInstance) => {
    instance.hidden = true;
    markDirty(instance.container);
  },
  unhideInstance: (instance: HostInstance) => {
    instance.hidden = false;
    markDirty(instance.container);
  },
  hideTextInstance: (instance: TextInstance) => {
    instance.hidden = true;
    markDirty(instance.container);
  },
  unhideTextInstance: (instance: TextInstance) => {
    instance.hidden = false;
    markDirty(instance.container);
  },

  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  scheduleMicrotask: queueMicrotask,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: () => undefined,
  afterActiveInstanceBlur: () => undefined,
  prepareScopeUpdate: () => undefined,
  getInstanceFromScope: () => null,
  detachDeletedInstance: () => undefined,
  setCurrentUpdatePriority: (priority: number) => {
    currentPriority = priority;
  },
  getCurrentUpdatePriority: () => currentPriority,
  resolveUpdatePriority: () => currentPriority || DefaultEventPriority,
  getCurrentEventPriority: () => DefaultEventPriority,
  resetFormInstance: () => undefined,
  requestPostPaintCallback: (callback: (time: number) => void) => callback(Date.now()),
  shouldAttemptEagerTransition: () => false,
  trackSchedulerEvent: () => undefined,
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1,
  maySuspendCommit: () => false,
  preloadInstance: () => true,
  startSuspendingCommit: () => undefined,
  suspendInstance: () => undefined,
  waitForCommitToBeReady: () => null,
};

const reconciler = ReactReconciler(hostConfig as never);
interface TransportOwnership {
  nextGeneration: number;
  activeGeneration: number;
  activeToken: symbol | null;
  readonly liveGenerations: Set<number>;
}

const transportOwners = new WeakMap<GraalyUiTransport, Map<string, TransportOwnership>>();

const playerOwnershipKey = (player: Player): string => {
  const identity = player as unknown as {
    readonly uniqueId?: unknown;
    readonly id?: unknown;
    readonly name?: unknown;
  };
  const selected = identity.uniqueId ?? identity.id ?? identity.name;
  if (selected == null || String(selected).length === 0) {
    throw new Error("A Graaly React root requires a player with a stable uniqueId, id, or name");
  }
  return String(selected);
};

const ownersFor = (transport: GraalyUiTransport): Map<string, TransportOwnership> => {
  let owners = transportOwners.get(transport);
  if (owners == null) {
    owners = new Map();
    transportOwners.set(transport, owners);
  }
  return owners;
};

const allocateOwnership = (transport: GraalyUiTransport, ownershipKey: string): number => {
  const owners = ownersFor(transport);
  let ownership = owners.get(ownershipKey);
  if (ownership == null) {
    ownership = {
      nextGeneration: 0,
      activeGeneration: 0,
      activeToken: null,
      liveGenerations: new Set(),
    };
    owners.set(ownershipKey, ownership);
  }
  const generation = ++ownership.nextGeneration;
  ownership.liveGenerations.add(generation);
  return generation;
};

const ownsTransport = (container: GraalyContainer): boolean =>
  (() => {
    const ownership = ownersFor(container.transport).get(container.ownershipKey);
    return ownership?.activeGeneration === container.ownershipGeneration
      && ownership.activeToken === container.ownershipToken;
  })();

const claimTransport = (container: GraalyContainer): boolean => {
  const ownership = ownersFor(container.transport).get(container.ownershipKey);
  if (ownership == null || container.ownershipGeneration < ownership.activeGeneration) {
    return false;
  }
  ownership.activeGeneration = container.ownershipGeneration;
  ownership.activeToken = container.ownershipToken;
  return true;
};

const releaseTransport = (container: GraalyContainer): void => {
  const owners = ownersFor(container.transport);
  const ownership = owners.get(container.ownershipKey);
  if (ownership == null) return;
  if (ownership.activeGeneration === container.ownershipGeneration
      && ownership.activeToken === container.ownershipToken) {
    ownership.activeToken = null;
  }
  ownership.liveGenerations.delete(container.ownershipGeneration);
  if (ownership.liveGenerations.size === 0) {
    owners.delete(container.ownershipKey);
  }
};

const visibleChildren = (instance: HostInstance): HostInstance[] =>
  instance.children.filter((child): child is HostInstance => "type" in child && !child.hidden);

const textContent = (instance: HostInstance): string => {
  const collect = (child: HostInstance | TextInstance): string => {
    if (child.hidden) return "";
    if ("text" in child) return child.text;
    return child.children.map(collect).join("");
  };
  return instance.children.map(collect).join("");
};

const actionId = (instance: HostInstance, suffix: string): string =>
  `react:${instance.serial}:${suffix}`;

const serialize = (container: GraalyContainer): {
  snapshot: Record<string, unknown>;
  handlers: Map<string, ActionHandler>;
} => {
  const snapshot: Record<string, unknown> = {
    messages: [],
    inventory: null,
    scoreboard: null,
    bossBar: null,
    tab: null,
    input: null,
  };
  const handlers = new Map<string, ActionHandler>();
  const roots = container.children.filter((child): child is HostInstance => "type" in child && !child.hidden);

  for (const instance of roots) {
    const props = instance.props;
    if (instance.type === HOST_MESSAGE) {
      (snapshot.messages as unknown[]).push({
        id: String(props.id ?? actionId(instance, "message")),
        channel: String(props.channel ?? "chat"),
        subtitle: String(props.subtitle ?? ""),
        text: textContent(instance),
      });
      continue;
    }
    if (instance.type === HOST_INVENTORY) {
      if (snapshot.inventory != null) throw new Error("A Graaly React root can render only one Inventory");
      const closeId = typeof props.onClose === "function" ? actionId(instance, "close") : "";
      if (closeId) handlers.set(closeId, props.onClose as ActionHandler);
      const items = visibleChildren(instance).map(child => {
        if (child.type !== HOST_ITEM) throw new Error("Inventory accepts only Item children");
        const clickId = typeof child.props.onClick === "function" ? actionId(child, "click") : "";
        if (clickId) handlers.set(clickId, child.props.onClick as ActionHandler);
        return {
          slot: Number(child.props.slot),
          material: String(child.props.material),
          amount: Number(child.props.amount ?? 1),
          durability: Number(child.props.durability ?? 0),
          name: child.props.name == null ? "" : String(child.props.name),
          lore: Array.isArray(child.props.lore) ? child.props.lore.map(String) : [],
          actionId: clickId,
        };
      });
      snapshot.inventory = {
        id: String(props.id),
        title: String(props.title),
        rows: Number(props.rows ?? 3),
        closeActionId: closeId,
        items,
      };
      continue;
    }
    if (instance.type === HOST_SCOREBOARD) {
      if (snapshot.scoreboard != null) throw new Error("A Graaly React root can render only one Scoreboard");
      snapshot.scoreboard = {
        title: String(props.title),
        lines: visibleChildren(instance).map(child => {
          if (child.type !== HOST_LINE) throw new Error("Scoreboard accepts only Line children");
          return { id: String(child.props.id), text: textContent(child) };
        }),
      };
      continue;
    }
    if (instance.type === HOST_BOSS_BAR) {
      if (snapshot.bossBar != null) throw new Error("A Graaly React root can render only one BossBar");
      snapshot.bossBar = { progress: Number(props.progress), text: textContent(instance) };
      continue;
    }
    if (instance.type === HOST_TAB) {
      if (snapshot.tab != null) throw new Error("A Graaly React root can render only one Tab");
      snapshot.tab = {
        id: String(props.id ?? "tab"),
        header: String(props.header ?? ""),
        footer: String(props.footer ?? ""),
      };
      continue;
    }
    if (instance.type === HOST_CHAT_INPUT) {
      if (snapshot.input != null) throw new Error("A Graaly React root can render only one ChatInput");
      const submitActionId = typeof props.onSubmit === "function" ? actionId(instance, "submit") : "";
      const cancelActionId = typeof props.onCancel === "function" ? actionId(instance, "cancel") : "";
      if (submitActionId) handlers.set(submitActionId, props.onSubmit as ActionHandler);
      if (cancelActionId) handlers.set(cancelActionId, props.onCancel as ActionHandler);
      snapshot.input = {
        id: String(props.id ?? actionId(instance, "input")),
        prompt: String(props.prompt ?? "Type your answer in chat."),
        value: String(props.value ?? ""),
        cancelWord: String(props.cancelWord ?? "cancel"),
        submitActionId,
        cancelActionId,
      };
      continue;
    }
    throw new Error(`${instance.type} must be nested in its matching Graaly UI surface`);
  }

  return { snapshot, handlers };
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const cloneSerializable = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

const freezeDeep = <T>(value: T): T => {
  if (value != null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
};

const diffSnapshot = (
  previous: unknown,
  next: unknown,
  path: string,
  operations: GraalyCommitOperation[],
): void => {
  if (Object.is(previous, next)) return;
  if (previous === undefined) {
    operations.push({ kind: "mount", path, next });
    return;
  }
  if (next === undefined) {
    operations.push({ kind: "remove", path, previous });
    return;
  }
  if (Array.isArray(previous) && Array.isArray(next)) {
    const length = Math.max(previous.length, next.length);
    for (let index = 0; index < length; index++) {
      diffSnapshot(previous[index], next[index], `${path}[${index}]`, operations);
    }
    return;
  }
  if (isPlainRecord(previous) && isPlainRecord(next)) {
    const names = new Set([...Object.keys(previous), ...Object.keys(next)]);
    for (const name of names) {
      diffSnapshot(previous[name], next[name], path ? `${path}.${name}` : name, operations);
    }
    return;
  }
  operations.push({ kind: "update", path, previous, next });
};

const publish = (container: GraalyContainer): void => {
  try {
    const next = serialize(container);
    const snapshot = freezeDeep(cloneSerializable(next.snapshot));
    const baseline = container.previousSnapshot ?? {
      messages: [], inventory: null, scoreboard: null, bossBar: null, tab: null, input: null,
    };
    const operations: GraalyCommitOperation[] = [];
    diffSnapshot(baseline, snapshot, "", operations);
    const commit = freezeDeep<GraalyCommit>({
      sequence: ++container.commitSequence,
      durationMs: Math.max(0, Date.now() - container.commitStartedAt),
      snapshot,
      operations: freezeDeep(operations.map(operation => ({ ...operation }))),
    });

    container.handlers = next.handlers;
    if (!container.suppressTransport && claimTransport(container)) {
      container.transport.render(container.player, snapshot, container.actionReceiver);
    }
    container.previousSnapshot = cloneSerializable(snapshot);
    container.lastCommit = commit;
    container.history.push(commit);
    if (container.history.length > container.historyLimit) {
      container.history.splice(0, container.history.length - container.historyLimit);
    }

    const listeners = [container.inspect, ...container.commitListeners].filter(
      (listener): listener is (selected: GraalyCommit) => void => listener != null,
    );
    for (const listener of listeners) {
      try {
        listener(commit);
      } catch (failure) {
        reportGraalyError(failure instanceof Error ? failure.stack ?? failure.message : String(failure));
      }
    }
  } catch (failure) {
    reportGraalyError(failure instanceof Error ? failure.stack ?? failure.message : String(failure));
  }
};

const handleReactError = (failure: unknown): void => {
  reportGraalyError(failure instanceof Error ? failure.stack ?? failure.message : String(failure));
};

export interface GraalyRoot {
  readonly player: Player;
  render(children: ReactNode): void;
  unmount(): void;
  getSnapshot(): Readonly<Record<string, unknown>> | null;
  getCommits(): readonly GraalyCommit[];
  subscribe(listener: (commit: GraalyCommit) => void): () => void;
}

const rootContainers = new WeakMap<GraalyRoot, GraalyContainer>();

export function createRoot(player: Player, options: GraalyRootOptions = {}): GraalyRoot {
  const transport = options.transport ?? (ui as GraalyUiTransport);
  const ownershipKey = playerOwnershipKey(player);
  const container: GraalyContainer = {
    player,
    transport,
    children: [],
    commitListeners: new Set(),
    handlers: new Map(),
    previousSnapshot: null,
    lastCommit: null,
    commitSequence: 0,
    commitStartedAt: Date.now(),
    history: [],
    historyLimit: Math.max(1, Math.min(500, options.historyLimit ?? 100)),
    ownershipKey,
    ownershipToken: Symbol("Graaly React root"),
    ownershipGeneration: allocateOwnership(transport, ownershipKey),
    suppressTransport: false,
    ...(options.inspect === undefined ? {} : { inspect: options.inspect }),
    actionReceiver: action => {
      if (!ownsTransport(container)) return;
      const selected = action.actionId == null ? undefined : container.handlers.get(action.actionId);
      if (selected == null) return;
      reconciler.discreteUpdates(() => {
        try {
          Promise.resolve(selected(action)).catch(handleReactError);
        } catch (failure) {
          handleReactError(failure);
        }
      }, undefined, undefined, undefined, undefined);
    },
  };
  const internalRoot = reconciler.createContainer(
    container,
    ConcurrentRoot,
    null,
    false,
    null,
    "graaly-",
    handleReactError,
    handleReactError,
    handleReactError,
    () => undefined,
  );

  let mounted = true;
  const root: GraalyRoot = {
    player,
    render(children) {
      if (!mounted) throw new Error("Cannot render an unmounted Graaly React root");
      reconciler.updateContainer(children, internalRoot, null);
    },
    unmount() {
      if (!mounted) return;
      mounted = false;
      const ownedTransport = ownsTransport(container);
      container.suppressTransport = true;
      reconciler.updateContainerSync(null, internalRoot, null);
      reconciler.flushSyncWork();
      container.suppressTransport = false;
      container.handlers.clear();
      container.commitListeners.clear();
      if (ownedTransport && ownsTransport(container)) {
        container.transport.clear(player);
      }
      releaseTransport(container);
      rootContainers.delete(root);
    },
    getSnapshot() {
      return container.lastCommit?.snapshot ?? null;
    },
    getCommits() {
      return container.history.slice();
    },
    subscribe(listener) {
      container.commitListeners.add(listener);
      return () => container.commitListeners.delete(listener);
    },
  };
  rootContainers.set(root, container);
  return root;
}

/** Render part of one React tree into another player's Graaly root. */
export function createPortal(children: ReactNode, target: GraalyRoot, key?: null | string): ReactPortal {
  const container = rootContainers.get(target);
  if (container == null) throw new Error("createPortal target must be a mounted Graaly root");
  return reconciler.createPortal(children, container, null, key ?? null) as unknown as ReactPortal;
}

reconciler.injectIntoDevTools({
  bundleType: 0,
  version: React.version,
  rendererPackageName: "@graaly/react",
});

export { React };
export type { Player, UiAction } from "graaly";
