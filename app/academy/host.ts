import type { Json } from "./types.ts";

type RecordValue = Record<string, unknown>;
type Callback = (...args: unknown[]) => unknown;
type Action = RecordValue & { kind: string; tick?: number };

/** A deterministic adapter for the SDK callback contracts, with observable effects. */
export function createAcademyHost(fixture: Json) {
  const data = structuredClone(fixture) as RecordValue;
  const trace: Json[] = [];
  let clock = 0, mainThread = true, nextTask = 1;
  const commandHandlers = new Map<string, Callback>();
  const completions = new Map<string, Callback>();
  const listeners = new Map<string, { callback: Callback; priority: string; ignoreCancelled: boolean }[]>();
  const timers = new Map<number, { at: number; period?: number; callback: Callback; async: boolean }>();
  const priority = ["LOWEST", "LOW", "NORMAL", "HIGH", "HIGHEST", "MONITOR"];
  const emit = (...values: unknown[]) => { trace.push(JSON.parse(JSON.stringify(values)) as Json); };
  const assertMain = () => { if (!mainThread) throw new Error("Server mutation on an async/network callback: use tasks.run."); };
  const playerList = new Map<string, RecordValue>();

  for (const selected of (data.players ?? []) as RecordValue[]) {
    const state = { health: 20, foodLevel: 20, hasPlayedBefore: false, online: true,
      uniqueId: selected.name, ...selected };
    const player = new Proxy(state as RecordValue, {
      get(target, key) {
        if (key === "sendMessage") return (message: unknown) => { assertMain(); emit("message", target.name, String(message)); };
        if (key === "hasPermission") return (permission: string) => ((target.permissions ?? []) as string[]).includes(permission);
        if (key === "teleport") return (location: unknown) => { assertMain(); target.location = location; emit("teleport", target.name, location); return true; };
        if (key === "kickPlayer") return (message: unknown) => { assertMain(); emit("kick", target.name, String(message)); };
        return target[String(key)];
      },
      set(target, key, value) { assertMain(); target[String(key)] = value; emit(String(key), target.name, value); return true; },
    });
    playerList.set(String(selected.name), player);
  }

  const consoleSender = { name: "CONSOLE", sendMessage: (message: unknown) => emit("message", "CONSOLE", String(message)),
    hasPermission: (permission: string) => ((data.consolePermissions ?? []) as string[]).includes(permission) };
  const sender = (name: unknown) => name === "CONSOLE" ? consoleSender : playerList.get(String(name));
  const players = {
    online: () => [...playerList.values()].filter(player => player.online),
    exact: (name: string) => [...playerList.values()].find(player => String(player.name).toLowerCase() === name.toLowerCase() && player.online) ?? null,
    get: (name: string) => [...playerList.values()].find(player => String(player.name).toLowerCase().startsWith(name.toLowerCase()) && player.online) ?? null,
    isPlayer: (value: unknown) => [...playerList.values()].includes(value as RecordValue),
    broadcast: (message: unknown) => { assertMain(); emit("broadcast", String(message)); },
    [Symbol.iterator]: () => players.online()[Symbol.iterator](),
  };
  const commands = {
    on(name: string, callback: Callback) { commandHandlers.set(name, callback); return callback; },
    handle: (name: string) => (callback: Callback) => commands.on(name, callback),
    complete(name: string, callback: Callback) { completions.set(name, callback); return callback; },
    completer: (name: string) => (callback: Callback) => commands.complete(name, callback),
    dispatch: (_sender: unknown, line: string) => { emit("dispatch", line); return true; },
  };
  const eventName = (type: unknown) => typeof type === "string" ? type : String((type as RecordValue)?.name);
  const events = {
    on(type: unknown, callback: Callback, options: RecordValue = {}) {
      const name = eventName(type), registrations = listeners.get(name) ?? [];
      registrations.push({ callback, priority: String(options.priority ?? "NORMAL"), ignoreCancelled: Boolean(options.ignoreCancelled) });
      registrations.sort((a, b) => priority.indexOf(a.priority) - priority.indexOf(b.priority));
      listeners.set(name, registrations); return callback;
    },
    listen: (type: unknown, options?: RecordValue) => (callback: Callback) => events.on(type, callback, options),
  };
  function schedule(delay: number, callback: Callback, async: boolean, period?: number) {
    if (!Number.isFinite(delay) || delay < 0 || (period !== undefined && period <= 0)) throw new Error("Invalid task delay/period.");
    const id = nextTask++;
    timers.set(id, { at: clock + delay, callback, async, period });
    return { id, cancel: () => timers.delete(id) };
  }
  const tasks = {
    ticks: (seconds: number) => Math.ceil(seconds * 20),
    run: (callback: Callback) => schedule(0, callback, false),
    later: (delay: number, callback: Callback) => schedule(delay, callback, false),
    repeat: (delay: number, period: number, callback: Callback) => schedule(delay, callback, false, period),
    runAsync: (callback: Callback) => schedule(0, callback, true),
    laterAsync: (delay: number, callback: Callback) => schedule(delay, callback, true),
    repeatAsync: (delay: number, period: number, callback: Callback) => schedule(delay, callback, true, period),
    cancel: (task: number | { id: number }) => { timers.delete(typeof task === "number" ? task : task.id); },
  };
  async function runDue(until: number) {
    let iterations = 0;
    while (true) {
      const due = [...timers].filter(([, task]) => task.at <= until).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!due) break;
      if (++iterations > 10000) throw new Error("Task budget exceeded; cancel repeating work.");
      const [id, task] = due; clock = task.at;
      if (task.period === undefined) timers.delete(id); else task.at += task.period;
      const previous = mainThread; mainThread = !task.async;
      try { await task.callback(); } finally { mainThread = previous; }
    }
    clock = until;
  }
  const settings = structuredClone((data.config ?? {}) as RecordValue);
  const getConfig = (path: string) => path.split(".").reduce<unknown>((value, key) =>
    value && typeof value === "object" && Object.hasOwn(value, key) ? (value as RecordValue)[key] : undefined, settings);
  const config = {
    get: (path: string, fallback?: unknown) => getConfig(path) ?? fallback,
    contains: (path: string) => getConfig(path) !== undefined,
    set(path: string, value: unknown) {
      const keys = path.split("."); if (keys.some(key => ["__proto__", "constructor", "prototype"].includes(key))) throw new Error("Unsafe config path.");
      let target = settings;
      for (const key of keys.slice(0, -1)) { if (!target[key] || typeof target[key] !== "object") target[key] = {}; target = target[key] as RecordValue; }
      target[keys[keys.length - 1]] = value; emit("config", path, value);
    },
    save: () => emit("config.save"), reload: () => emit("config.reload"),
  };
  const worldList = new Map<string, RecordValue>();
  for (const initial of (data.worlds ?? []) as RecordValue[]) {
    const world = new Proxy({ time: 0, ...initial } as RecordValue, {
      get(target, key) {
        if (key === "spawnLocation") return { world: target.name, x: 0, y: 64, z: 0, ...((target.spawn ?? {}) as RecordValue) };
        if (key === "getBlockAt") return (x: number, y: number, z: number) => new Proxy({ type: "AIR" }, {
          set(block, field, value) { assertMain(); (block as RecordValue)[String(field)] = value; emit("block", target.name, x, y, z, value); return true; },
        });
        return target[String(key)];
      },
      set(target, key, value) { assertMain(); target[String(key)] = value; emit("world." + String(key), target.name, value); return true; },
    }); worldList.set(String(initial.name), world);
  }
  const worlds = {
    get: (name: string) => worldList.get(name) ?? null, all: () => [...worldList.values()],
    location: (world: RecordValue, x: number, y: number, z: number, yaw = 0, pitch = 0) => ({ world: world.name, x, y, z, yaw, pitch }),
    create: (name: string, options: unknown = {}) => { assertMain(); emit("world.create", name, options); const world = { name }; worldList.set(name, world); return world; },
    unload: (world: RecordValue | string, save = true) => { assertMain(); const name = typeof world === "string" ? world : String(world.name); emit("world.unload", name, save); return worldList.delete(name); },
  };
  let nextEntity = 1;
  const entities = {
    type: (name: string) => name, attributeType: (name: string) => name,
    spawn(type: unknown, location: unknown, options: unknown = {}) {
      assertMain(); const id = nextEntity++; emit("spawn", type, location, options);
      return new Proxy({ id, type } as RecordValue, { set(target, key, value) { assertMain(); target[String(key)] = value; emit("entity." + String(key), id, value); return true; } });
    },
    remove: (entity: RecordValue) => { assertMain(); emit("remove", entity.id); },
    configure: (entity: RecordValue, options: RecordValue) => { for (const [key, value] of Object.entries(options)) entity[key] = value; return entity; },
    attribute: (entity: RecordValue, attribute: string, value?: number) => { if (value !== undefined) emit("attribute", entity.id, attribute, value); return value ?? 0; },
  };
  const ui = {
    render: (player: RecordValue, snapshot: unknown) => { assertMain(); emit("ui.render", player.name, snapshot); },
    renderHtml: (player: RecordValue, markup: string, options: unknown = {}) => { assertMain(); emit("ui.html", player.name, markup, options); },
    clear: (player: RecordValue) => { assertMain(); emit("ui.clear", player.name); },
    dismiss: (player: RecordValue, surface: string) => { assertMain(); emit("ui.dismiss", player.name, surface); },
  };
  async function request(url: string, options: RecordValue = {}) {
    emit("http", options.method ?? "GET", url, options.body ?? null);
    const response = ((data.responses ?? {}) as Record<string, RecordValue>)[url];
    if (!response) throw new Error("No HTTP fixture for " + url);
    return { status: response.status ?? 200, ok: Number(response.status ?? 200) >= 200 && Number(response.status ?? 200) < 300,
      headers: response.headers ?? {}, text: async () => typeof response.body === "string" ? response.body : JSON.stringify(response.body),
      json: async () => structuredClone(response.body) };
  }
  const http = { request, get: (url: string, options = {}) => request(url, { ...options, method: "GET" }),
    post: (url: string, body: unknown, options = {}) => request(url, { ...options, method: "POST", body }),
    put: (url: string, body: unknown, options = {}) => request(url, { ...options, method: "PUT", body }),
    delete: (url: string, options = {}) => request(url, { ...options, method: "DELETE" }) };
  const features = new Set((data.features ?? []) as string[]);
  const compatibility = { contractVersion: "1.0", minimumGameVersion: "1.7.10", minecraftVersion: data.version ?? "26.2",
    serverVersion: data.version ?? "26.2", supports: (feature: string) => features.has(feature),
    require(feature: string) { if (!features.has(feature)) { const error = new Error("Unsupported: " + feature); error.name = "GraalyUnsupportedFeature"; throw error; } },
    typeAvailable: (name: string) => ((data.types ?? []) as string[]).includes(name), material: (name: string) => name };
  const packetListeners: { direction: string; type: string; callback: Callback }[] = [];
  const packets = {
    available: data.packetAvailable !== false, version: "2.13.0",
    onReceive: (type: unknown, callback: Callback) => { packetListeners.push({ direction: "receive", type: eventName(type), callback }); return callback; },
    onSend: (type: unknown, callback: Callback) => { packetListeners.push({ direction: "send", type: eventName(type), callback }); return callback; },
    create: (type: unknown, ...args: unknown[]) => ({ type: eventName(type), args }),
    wrap: (type: unknown, event: unknown) => (event as RecordValue).packet ?? { type: eventName(type) },
    send: (player: RecordValue, packet: unknown) => emit("packet.send", player.name, packet),
    sendToAll: (packet: unknown) => emit("packet.broadcast", packet), receive: (player: RecordValue, packet: unknown) => emit("packet.receive", player.name, packet),
    user: (player: RecordValue) => ({ name: player.name }), clientVersion: (player: RecordValue) => player.clientVersion ?? "26.2",
    ping: (player: RecordValue) => player.ping ?? 0,
  };
  const socketListeners = new Map<string, Callback[]>();
  const connection = { readyState: "OPEN", send: (message: unknown) => emit("websocket.send", message),
    close: () => { connection.readyState = "CLOSED"; emit("websocket.close"); },
    on(type: string, callback: Callback) { const list = socketListeners.get(type) ?? []; list.push(callback); socketListeners.set(type, list); return () => socketListeners.set(type, list.filter(value => value !== callback)); } };
  const websocket = { connect: async (url: string) => { emit("websocket.connect", url); return connection; } };
  const boards = { available: false, state: (id: string, state: unknown) => emit("board.state", id, state),
    refresh: (id: string) => emit("board.refresh", id), onMessage: (id: string, callback: Callback) => socketListeners.set("board:" + id, [callback]) };
  const exports: RecordValue = { commands, events, tasks, players, worlds, entities, config, http, ui, compatibility, packets, websocket, boards,
    diagnostics: { verify: () => structuredClone(data.diagnostics ?? { ok: true, checked: 14 }) },
    info: (...values: unknown[]) => emit("log", "info", ...values), warn: (...values: unknown[]) => emit("log", "warn", ...values),
    error: (...values: unknown[]) => emit("log", "error", ...values), Player: { name: "Player" },
  };
  const symbols = ["PlayerJoinEvent", "PlayerQuitEvent", "PlayerMoveEvent", "BlockBreakEvent", "EntityDamageEvent", "PlayerDeathEvent",
    "InventoryClickEvent", "AsyncPlayerChatEvent", "WrapperPlayClientChatMessage", "WrapperPlayServerUpdateHealth"];
  for (const name of symbols) exports[name] = { name };
  for (const name of ["Materials", "Sounds", "Particles", "EntityTypes", "Attributes", "GameModes", "Difficulties", "Biomes", "PotionEffects", "Enchantments"])
    exports[name] = new Proxy({}, { get: (_target, key) => String(key) });
  exports.ClientPacket = new Proxy({}, { get: (_target, key) => ({ name: "Play.Client." + String(key) }) });
  exports.ServerPacket = new Proxy({}, { get: (_target, key) => ({ name: "Play.Server." + String(key) }) });

  async function drive(teardown?: unknown) {
    for (const action of (data.actions ?? []) as Action[]) {
      await runDue(action.tick ?? clock);
      if (action.kind === "advance") continue;
      if (action.kind === "command" || action.kind === "complete") {
        const actor = sender(action.sender);
        if (!actor) throw new Error("Unknown scenario sender: " + action.sender);
        const context = { sender: actor, args: action.args ?? [], label: action.name,
          reply: (message: unknown) => (actor.sendMessage as Callback)(message), hasPermission: (permission: string) => (actor.hasPermission as Callback)(permission) };
        const handler = (action.kind === "complete" ? completions : commandHandlers).get(String(action.name));
        if (!handler) throw new Error("Register " + action.name + " with commands." + (action.kind === "complete" ? "complete" : "on") + ".");
        const result = await handler(context);
        if (action.kind === "complete") emit("complete", action.name, [...((result ?? []) as Iterable<unknown>)]);
        else if (result === false) emit("usage", action.sender, action.name);
      } else if (action.kind === "event") {
        const raw = { ...(action.data as RecordValue ?? {}), player: playerList.get(String(action.player)), cancelled: Boolean(action.cancelled) };
        const event = new Proxy(raw as RecordValue, { set(target, key, value) { target[String(key)] = value; emit("event." + String(key), action.name, value); return true; } });
        for (const registration of listeners.get(String(action.name)) ?? []) {
          if (event.cancelled && registration.ignoreCancelled) continue;
          const previous = mainThread; mainThread = !String(action.name).startsWith("Async");
          try { await registration.callback(event); } finally { mainThread = previous; }
        }
      } else if (action.kind === "packet") {
        const event = { packet: { ...(action.data as RecordValue ?? {}) }, player: playerList.get(String(action.player)) ?? null,
          packetName: action.name, cancelled: false, direction: action.direction ?? "receive" };
        const context = { ...event, isCancelled: () => event.cancelled,
          cancel: (cancelled = true) => { event.cancelled = cancelled; emit("packet.cancel", action.name, cancelled); },
          reencode: () => emit("packet.reencode", action.name, event.packet), wrap: () => event.packet };
        for (const listener of packetListeners.filter(listener => listener.type === action.name && listener.direction === event.direction)) {
          mainThread = false; try { await listener.callback(context); } finally { mainThread = true; }
        }
      } else if (action.kind === "socket") {
        for (const callback of socketListeners.get(String(action.type ?? "message")) ?? []) await callback({ data: action.data, type: action.type ?? "message" });
      } else if (action.kind === "disable" && typeof teardown === "function") await teardown();
    }
    await runDue(clock);
    return trace;
  }
  return { exports, input: { ...data, now: () => clock }, trace, drive };
}
