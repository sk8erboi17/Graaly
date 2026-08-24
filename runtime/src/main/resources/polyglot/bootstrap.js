(function installGraalySdk(global) {
    "use strict";

    const bridge = global.__graaly_bridge__;
    const rawPlugin = global.__graaly_plugin__;
    const rawServer = global.__graaly_server__;
    const rawLogger = global.__graaly_logger__;
    const rawDataFolder = global.__graaly_data_folder__;
    const httpBridge = bridge.getHttp();
    const websocketBridge = bridge.getWebSocket();
    const uiBridge = bridge.getUi();
    // Symbols are closure-private: wrapped host values can be unwrapped by the
    // SDK itself without exposing a host-object escape hatch.
    const RAW = Symbol("Graaly value");
    const CLASS = Symbol("Graaly API type");

    const array = values => values == null ? [] : Array.from(values);
    const unwrap = value => {
        if (value == null) return value;
        try {
            if (value[RAW] != null) return value[RAW];
            if (value[CLASS] != null) return value[CLASS];
        } catch (_) {
            // Ordinary guest values have no Graaly marker.
        }
        if (Array.isArray(value)) return value.map(unwrap);
        return value;
    };

    const finiteNumber = (value, name = "value") => {
        if (typeof value !== "number") {
            throw new TypeError(`${name} must be a number; strings, booleans, and bigint are not converted`);
        }
        if (!Number.isFinite(value)) {
            throw new RangeError(`${name} must be finite`);
        }
        return value;
    };

    const safeInteger = (value, name = "value") => {
        const selected = finiteNumber(value, name);
        if (!Number.isSafeInteger(selected)) {
            throw new RangeError(`${name} must be a safe integer`);
        }
        return selected;
    };

    class GraalyUnsupportedFeature extends Error {
        constructor(message, feature = null, minecraftVersion = null) {
            super(String(message));
            this.name = "GraalyUnsupportedFeature";
            this.feature = feature;
            this.minecraftVersion = minecraftVersion;
        }
    }

    const graalyCall = callback => {
        try {
            return callback();
        } catch (failure) {
            if (failure instanceof GraalyUnsupportedFeature) throw failure;
            const message = String(failure && failure.message != null ? failure.message : failure);
            const match = message.match(/Graaly feature '([^']+)' is unavailable on Minecraft ([0-9]+(?:\.[0-9]+){1,2})\./);
            if (match || message.includes("GraalyUnsupportedFeature")) {
                throw new GraalyUnsupportedFeature(message, match ? match[1] : null, match ? match[2] : null);
            }
            throw failure;
        }
    };

    // Graal host objects are object-like but are not valid WeakMap keys on all
    // engine builds. A context-local Map has the same lifetime as the plugin.
    const nativeCache = new Map();
    const isObject = value => (typeof value === "object" && value !== null) || typeof value === "function";
    const arrayIndex = property => {
        if (typeof property !== "string" || !/^(?:0|[1-9]\d*)$/.test(property)) return null;
        const index = Number(property);
        return Number.isSafeInteger(index) ? index : null;
    };
    const normalizedIndex = (index, size, allowEnd = false) => {
        let selected = Number(index);
        if (!Number.isInteger(selected)) selected = 0;
        if (selected < 0) selected = Math.max(size + selected, 0);
        return Math.min(selected, allowEnd ? size : Math.max(size - 1, 0));
    };

    const liveArray = raw => {
        let proxy;
        const snapshot = () => array(bridge.collectionValues(raw)).map(native);
        const replaceFrom = values => {
            const size = Number(bridge.collectionSize(raw));
            if (values.length !== size) {
                throw new TypeError("This collection operation cannot change the collection size");
            }
            for (let index = 0; index < size; index++) {
                bridge.collectionSet(raw, index, unwrap(values[index]));
            }
            return proxy;
        };
        proxy = new Proxy([], {
            get(_target, property) {
                if (property === RAW) return raw;
                if (property === "length") return Number(bridge.collectionSize(raw));
                if (property === Symbol.toStringTag) return "Array";
                if (property === Symbol.iterator) return () => snapshot()[Symbol.iterator]();
                const index = arrayIndex(property);
                if (index != null) {
                    return index < Number(bridge.collectionSize(raw))
                        ? native(bridge.collectionGet(raw, index))
                        : undefined;
                }
                switch (property) {
                    case "push": return (...items) => {
                        for (const item of items) bridge.collectionAdd(raw, unwrap(item));
                        return Number(bridge.collectionSize(raw));
                    };
                    case "pop": return () => {
                        const size = Number(bridge.collectionSize(raw));
                        return size ? native(bridge.collectionRemoveAt(raw, size - 1)) : undefined;
                    };
                    case "shift": return () => Number(bridge.collectionSize(raw))
                        ? native(bridge.collectionRemoveAt(raw, 0)) : undefined;
                    case "unshift": return (...items) => {
                        for (let index = items.length - 1; index >= 0; index--) {
                            bridge.collectionInsert(raw, 0, unwrap(items[index]));
                        }
                        return Number(bridge.collectionSize(raw));
                    };
                    case "splice": return (start, deleteCount, ...items) => {
                        const size = Number(bridge.collectionSize(raw));
                        const selected = normalizedIndex(start, size, true);
                        const removals = deleteCount == null
                            ? size - selected
                            : Math.max(0, Math.min(Number(deleteCount), size - selected));
                        const removed = [];
                        for (let index = 0; index < removals; index++) {
                            removed.push(native(bridge.collectionRemoveAt(raw, selected)));
                        }
                        for (let index = 0; index < items.length; index++) {
                            bridge.collectionInsert(raw, selected + index, unwrap(items[index]));
                        }
                        return removed;
                    };
                    case "reverse": return () => replaceFrom(snapshot().reverse());
                    case "sort": return compare => replaceFrom(snapshot().sort(compare));
                    case "fill": return (value, start, end) => replaceFrom(snapshot().fill(value, start, end));
                    case "copyWithin": return (target, start, end) => replaceFrom(snapshot().copyWithin(target, start, end));
                    case "includes": return item => Boolean(bridge.collectionContains(raw, unwrap(item)));
                    case "toJSON": return snapshot;
                    default: {
                        const method = Array.prototype[property];
                        return typeof method === "function" ? (...args) => method.apply(snapshot(), args) : undefined;
                    }
                }
            },
            set(_target, property, value) {
                const index = arrayIndex(property);
                if (index == null) return false;
                const size = Number(bridge.collectionSize(raw));
                if (index === size) {
                    bridge.collectionAdd(raw, unwrap(value));
                    return true;
                }
                if (index < size) {
                    bridge.collectionSet(raw, index, unwrap(value));
                    return true;
                }
                throw new RangeError(`Cannot create sparse index ${index} in a live server collection`);
            },
            deleteProperty(_target, property) {
                const index = arrayIndex(property);
                if (index == null) return false;
                bridge.collectionRemoveAt(raw, index);
                return true;
            }
        });
        nativeCache.set(raw, proxy);
        return proxy;
    };

    const liveSet = raw => {
        let proxy;
        const snapshot = () => array(bridge.collectionValues(raw)).map(native);
        proxy = new Proxy(new Set(), {
            get(_target, property) {
                if (property === RAW) return raw;
                if (property === "size") return Number(bridge.collectionSize(raw));
                if (property === Symbol.toStringTag) return "Set";
                if (property === Symbol.iterator || property === "values" || property === "keys") {
                    return () => snapshot()[Symbol.iterator]();
                }
                if (property === "entries") return () => snapshot().map(item => [item, item])[Symbol.iterator]();
                if (property === "has") return item => Boolean(bridge.collectionContains(raw, unwrap(item)));
                if (property === "add") return item => {
                    bridge.collectionAdd(raw, unwrap(item));
                    return proxy;
                };
                if (property === "delete") return item => Boolean(bridge.collectionRemoveValue(raw, unwrap(item)));
                if (property === "clear") return () => bridge.collectionClear(raw);
                if (property === "forEach") return (callback, thisArg) => {
                    for (const item of snapshot()) callback.call(thisArg, item, item, proxy);
                };
                return undefined;
            }
        });
        nativeCache.set(raw, proxy);
        return proxy;
    };

    const liveMap = raw => {
        let proxy;
        const entries = () => array(bridge.mapEntries(raw)).map(entry => {
            const pair = array(entry);
            return [native(pair[0]), native(pair[1])];
        });
        proxy = new Proxy(new Map(), {
            get(_target, property) {
                if (property === RAW) return raw;
                if (property === "size") return Number(bridge.mapSize(raw));
                if (property === Symbol.toStringTag) return "Map";
                if (property === Symbol.iterator || property === "entries") return () => entries()[Symbol.iterator]();
                if (property === "keys") return () => entries().map(entry => entry[0])[Symbol.iterator]();
                if (property === "values") return () => entries().map(entry => entry[1])[Symbol.iterator]();
                if (property === "has") return key => Boolean(bridge.mapContainsKey(raw, unwrap(key)));
                if (property === "get") return key => native(bridge.mapGet(raw, unwrap(key)));
                if (property === "set") return (key, value) => {
                    bridge.mapPut(raw, unwrap(key), unwrap(value));
                    return proxy;
                };
                if (property === "delete") return key => {
                    const present = Boolean(bridge.mapContainsKey(raw, unwrap(key)));
                    if (present) bridge.mapRemove(raw, unwrap(key));
                    return present;
                };
                if (property === "clear") return () => bridge.mapClear(raw);
                if (property === "forEach") return (callback, thisArg) => {
                    for (const [key, value] of entries()) callback.call(thisArg, value, key, proxy);
                };
                if (property === "toJSON") return () => Object.fromEntries(entries());
                return undefined;
            }
        });
        nativeCache.set(raw, proxy);
        return proxy;
    };

    /**
     * Turn a host object into a JavaScript view: JavaBean getters become
     * properties, setters accept assignment, return values are adapted, and
     * method arguments are unwrapped automatically.
     */
    const native = value => {
        if (!isObject(value)) return value;
        try {
            if (value[RAW] != null || value[CLASS] != null) return value;
        } catch (_) {
            // Continue with an ordinary host object.
        }
        const cached = nativeCache.get(value);
        if (cached) return cached;
        if (bridge.isCollection(value)) {
            return String(bridge.collectionKind(value)) === "set" ? liveSet(value) : liveArray(value);
        }
        if (bridge.isMap(value)) return liveMap(value);
        if (bridge.isOptional(value)) return native(bridge.optionalValue(value));

        const proxy = new Proxy(value, {
            get(target, property) {
                if (property === RAW) return target;
                if (property === Symbol.toStringTag) return "GraalyObject";
                if (typeof property === "symbol") return Reflect.get(target, property);
                const name = String(property);
                if (bridge.hasProperty(target, name)) {
                    return native(bridge.property(target, name));
                }
                if (bridge.isPropertyAccessor(target, name)) {
                    return undefined;
                }
                if (bridge.hasMethod(target, name)) {
                    return (...args) => {
                        if (bridge.isPropertyAccessorCall(target, name, args.length)) {
                            throw new TypeError(`Java-style accessor ${name}() is not exposed; use the native property instead`);
                        }
                        return native(bridge.invokePacked(target, name, args.map(unwrap)));
                    };
                }
                try {
                    const member = target[name];
                    if (typeof member === "function") {
                        return (...args) => native(member(...args.map(unwrap)));
                    }
                    if (member !== undefined) return native(member);
                } catch (_) {
                    // Canonical-member handling below distinguishes a removed
                    // release feature from an ordinary JavaScript typo.
                }
                if (bridge.hasCanonicalInstanceMember(target, name)) {
                    return graalyCall(() => bridge.unavailableInstanceMember(target, name));
                }
                return undefined;
            },
            set(target, property, valueToSet) {
                const name = typeof property === "symbol" ? null : String(property);
                if (name != null && bridge.hasWritableProperty(target, name)) {
                    bridge.setProperty(target, name, unwrap(valueToSet));
                    return true;
                }
                if (name != null && bridge.hasCanonicalWritableMember(target, name)) {
                    graalyCall(() => bridge.unavailableInstanceMember(target, name));
                }
                try {
                    target[property] = unwrap(valueToSet);
                    return true;
                } catch (_) {
                    return false;
                }
            }
        });
        nativeCache.set(value, proxy);
        return proxy;
    };

    const typeCache = new Map();
    const typeView = (rawType, exportedName) => {
        const cached = typeCache.get(rawType);
        if (cached) return cached;
        const construct = (...args) => native(bridge.constructPacked(rawType, args.map(unwrap)));
        const view = new Proxy(construct, {
            apply(_target, _thisArg, args) {
                return construct(...args);
            },
            construct(_target, args) {
                return construct(...args);
            },
            get(target, property) {
                if (property === CLASS) return rawType;
                if (property === "displayName") return exportedName;
                if (property === Symbol.toStringTag) return "GraalyType";
                if (typeof property === "symbol") return Reflect.get(target, property);
                const name = String(property);
                if (bridge.hasStaticMember(rawType, name)) {
                    const member = graalyCall(() => bridge.staticMember(rawType, name));
                    return bridge.isType(member) ? typeView(member, `${exportedName}.${name}`) : native(member);
                }
                if (bridge.hasMethod(rawType, name)) {
                    return (...args) => native(bridge.invokePacked(rawType, name, args.map(unwrap)));
                }
                try {
                    const member = rawType[name];
                    if (typeof member === "function") {
                        return (...args) => native(member(...args.map(unwrap)));
                    }
                    if (member !== undefined) return native(member);
                } catch (_) {
                    // Canonical static-member handling below.
                }
                if (bridge.hasCanonicalStaticMember(rawType, name)) {
                    return graalyCall(() => bridge.unavailableStaticMember(rawType, name));
                }
                return undefined;
            }
        });
        typeCache.set(rawType, view);
        return view;
    };

    const makeLazyCatalog = (names, resolver) => {
        const catalog = {};
        const cache = new Map();
        for (const rawName of array(names)) {
            const name = String(rawName);
            Object.defineProperty(catalog, name, {
                enumerable: true,
                configurable: false,
                get() {
                    if (!cache.has(name)) cache.set(name, resolver(name));
                    return cache.get(name);
                }
            });
        }
        return Object.freeze(catalog);
    };

    const bukkit = makeLazyCatalog(
        bridge.getApiTypeNames(),
        name => typeView(graalyCall(() => bridge.namedApiType(name)), name)
    );

    const constantGlobalNames = Object.freeze({
        Material: "Materials",
        Sound: "Sounds",
        Particle: "Particles",
        DyeColor: "DyeColors",
        EntityType: "EntityTypes",
        Attribute: "Attributes",
        GameMode: "GameModes",
        Difficulty: "Difficulties",
        WorldEnvironment: "WorldEnvironments",
        WorldType: "WorldTypes",
        Biome: "Biomes",
        PotionEffect: "PotionEffects",
        Enchantment: "Enchantments"
    });
    const constantGlobals = {};
    const constantModules = {};
    for (const namespace of array(bridge.getConstantNamespaceNames()).map(String)) {
        const values = makeLazyCatalog(
            bridge.getConstantNames(namespace),
            name => native(graalyCall(() => bridge.namedConstant(namespace, name)))
        );
        constantModules[namespace] = values;
        constantGlobals[constantGlobalNames[namespace]] = values;
    }
    const constants = Object.freeze(constantModules);
    Object.freeze(constantGlobals);

    const eventOptions = options => ({
        priority: options && options.priority ? String(options.priority) : "NORMAL",
        ignoreCancelled: Boolean(options && options.ignoreCancelled)
    });

    const events = Object.freeze({
        on(eventType, callback, options = {}) {
            const selected = eventOptions(options);
            bridge.on(unwrap(eventType), selected.priority, selected.ignoreCancelled,
                raw => callback(native(raw)));
            return callback;
        },
        listen(eventType, options = {}) {
            return callback => events.on(eventType, callback, options);
        }
    });

    const commandContext = (sender, command, label, args) => Object.freeze({
        sender: native(sender),
        command: native(command),
        label: String(label),
        args: array(args).map(String),
        reply: message => sender.sendMessage(bridge.color(message)),
        hasPermission: permission => sender.hasPermission(String(permission))
    });

    const commands = Object.freeze({
        on(name, callback) {
            const adapted = (sender, command, label, args) =>
                callback(commandContext(sender, command, label, args));
            bridge.command(name, adapted);
            return callback;
        },
        handle(name) {
            return callback => commands.on(name, callback);
        },
        complete(name, callback) {
            const adapted = (sender, command, label, args) =>
                callback(commandContext(sender, command, label, args));
            bridge.tabComplete(name, adapted);
            return callback;
        },
        completer(name) {
            return callback => commands.complete(name, callback);
        },
        dispatch(sender, commandLine) {
            return rawServer.dispatchCommand(unwrap(sender), String(commandLine));
        }
    });

    const tasks = Object.freeze({
        ticks: seconds => bridge.seconds(seconds),
        run: callback => native(bridge.run(callback)),
        later: (delay, callback) => native(bridge.later(delay, callback)),
        repeat: (delay, period, callback) => native(bridge.repeat(delay, period, callback)),
        runAsync: callback => native(bridge.runAsync(callback)),
        laterAsync: (delay, callback) => native(bridge.laterAsync(delay, callback)),
        repeatAsync: (delay, period, callback) => native(bridge.repeatAsync(delay, period, callback)),
        cancel: task => bridge.cancel(unwrap(task)),
        delay(ticks = 1) {
            return new Promise(resolve => bridge.later(ticks, resolve));
        },
        sleep(seconds) {
            return tasks.delay(bridge.seconds(seconds));
        }
    });

    // React and its scheduler expect the standard host timer surface. GraalJS
    // intentionally ships without browser/Node timers, so Graaly maps them to
    // the server scheduler while preserving ordinary JavaScript semantics.
    let timerSequence = 1;
    const timers = new Map();
    const scheduleTimer = (callback, milliseconds, repeated, args) => {
        if (typeof callback !== "function") throw new TypeError("timer callback must be a function");
        const id = timerSequence++;
        const ticks = Math.max(1, Math.ceil(Math.max(0, Number(milliseconds) || 0) / 50));
        const invoke = () => {
            if (!repeated) timers.delete(id);
            callback(...args);
        };
        const handle = repeated ? tasks.repeat(ticks, ticks, invoke) : tasks.later(ticks, invoke);
        timers.set(id, handle);
        return id;
    };
    const cancelTimer = id => {
        const handle = timers.get(Number(id));
        if (handle == null) return;
        timers.delete(Number(id));
        tasks.cancel(handle);
    };
    const installHostGlobal = (name, value) => {
        if (typeof global[name] !== "undefined") return;
        Object.defineProperty(global, name, { value, configurable: false, writable: false });
    };
    installHostGlobal("setTimeout", (callback, delay = 0, ...args) =>
        scheduleTimer(callback, delay, false, args));
    installHostGlobal("clearTimeout", cancelTimer);
    installHostGlobal("setInterval", (callback, delay = 0, ...args) =>
        scheduleTimer(callback, delay, true, args));
    installHostGlobal("clearInterval", cancelTimer);
    installHostGlobal("setImmediate", (callback, ...args) =>
        scheduleTimer(callback, 0, false, args));
    installHostGlobal("clearImmediate", cancelTimer);
    installHostGlobal("queueMicrotask", callback => Promise.resolve().then(callback));

    // GraalJS has no browser globals. This is the standard AbortController
    // contract needed by React Effects, query libraries, and ordinary JS code.
    class GraalyAbortSignal {
        constructor() {
            this.aborted = false;
            this.reason = undefined;
            this._listeners = new Set();
        }

        addEventListener(type, listener, options = {}) {
            if (type !== "abort" || listener == null) return;
            const entry = { listener, once: Boolean(options && options.once) };
            this._listeners.add(entry);
            if (this.aborted) Promise.resolve().then(() => this._invoke(entry));
        }

        removeEventListener(type, listener) {
            if (type !== "abort") return;
            for (const entry of this._listeners) {
                if (entry.listener === listener) this._listeners.delete(entry);
            }
        }

        throwIfAborted() {
            if (this.aborted) throw this.reason;
        }

        _invoke(entry) {
            if (!this._listeners.has(entry)) return;
            if (entry.once) this._listeners.delete(entry);
            if (typeof entry.listener === "function") entry.listener.call(this, { type: "abort", target: this });
            else if (typeof entry.listener.handleEvent === "function") entry.listener.handleEvent({ type: "abort", target: this });
        }

        _abort(reason) {
            if (this.aborted) return;
            const selected = reason === undefined ? new Error("This operation was aborted") : reason;
            if (selected instanceof Error && selected.name === "Error") selected.name = "AbortError";
            this.aborted = true;
            this.reason = selected;
            for (const entry of [...this._listeners]) this._invoke(entry);
        }
    }

    class GraalyAbortController {
        constructor() {
            this.signal = new GraalyAbortSignal();
        }

        abort(reason) {
            this.signal._abort(reason);
        }
    }

    installHostGlobal("AbortController", GraalyAbortController);
    installHostGlobal("AbortSignal", GraalyAbortSignal);

    const httpResponse = payload => Object.freeze({
        status: Number(payload.status),
        ok: Boolean(payload.ok),
        headers: Object.freeze(payload.headers || {}),
        body: String(payload.body || ""),
        text() {
            return Promise.resolve(String(payload.body || ""));
        },
        json() {
            return Promise.resolve(JSON.parse(String(payload.body || "")));
        }
    });
    const http = Object.freeze({
        request(url, options = {}) {
            const selected = options || {};
            const headers = { ...(selected.headers || {}) };
            const signal = selected.signal;
            if (signal != null && (typeof signal.addEventListener !== "function"
                    || typeof signal.removeEventListener !== "function")) {
                return Promise.reject(new TypeError("HTTP signal must be an AbortSignal"));
            }
            let body = selected.body == null ? "" : selected.body;
            if (typeof body !== "string") {
                body = JSON.stringify(body);
                if (!Object.keys(headers).some(name => name.toLowerCase() === "content-type")) {
                    headers["content-type"] = "application/json";
                }
            }
            return new Promise((resolve, reject) => {
                let requestId = null;
                let settled = false;
                const cleanup = () => {
                    if (signal != null) signal.removeEventListener("abort", abort);
                };
                const abort = () => {
                    if (settled) return;
                    settled = true;
                    if (requestId != null) httpBridge.cancel(String(requestId));
                    cleanup();
                    const reason = signal && signal.reason;
                    reject(reason instanceof Error ? reason : new Error(String(reason || "This operation was aborted")));
                };
                if (signal != null && signal.aborted) {
                    abort();
                    return;
                }
                if (signal != null) signal.addEventListener("abort", abort, { once: true });
                try {
                    requestId = httpBridge.request(
                        String(selected.method || "GET"),
                        String(url),
                        JSON.stringify(headers),
                        String(body),
                        Number(selected.timeout || 15000),
                        raw => {
                            if (settled) return;
                            settled = true;
                            cleanup();
                            const payload = JSON.parse(String(raw));
                            if (payload.error) reject(new Error(String(payload.error)));
                            else resolve(httpResponse(payload));
                        }
                    );
                } catch (error) {
                    settled = true;
                    cleanup();
                    reject(error);
                }
            });
        },
        get(url, options = {}) {
            return http.request(url, { ...options, method: "GET" });
        },
        post(url, body, options = {}) {
            return http.request(url, { ...options, method: "POST", body });
        },
        put(url, body, options = {}) {
            return http.request(url, { ...options, method: "PUT", body });
        },
        delete(url, options = {}) {
            return http.request(url, { ...options, method: "DELETE" });
        }
    });

    class GraalyWebSocketConnection {
        constructor(id, resolveOpen, rejectOpen) {
            this.id = String(id);
            this.readyState = "CONNECTING";
            this._resolveOpen = resolveOpen;
            this._rejectOpen = rejectOpen;
            this._settled = false;
            this._listeners = new Map();
        }
        on(type, listener) {
            if (typeof listener !== "function") {
                throw new TypeError("WebSocket listener must be a function");
            }
            const selected = String(type);
            const listeners = this._listeners.get(selected) || new Set();
            listeners.add(listener);
            this._listeners.set(selected, listeners);
            return () => listeners.delete(listener);
        }
        onMessage(listener) {
            const adapted = event => listener(String(event.data || ""), event);
            return this.on("message", adapted);
        }
        onBinary(listener) {
            const adapted = event => listener(String(event.data || ""), Boolean(event.last), event);
            return this.on("binary", adapted);
        }
        onClose(listener) {
            return this.on("close", listener);
        }
        onError(listener) {
            return this.on("error", listener);
        }
        send(data) {
            if (this.readyState !== "OPEN") {
                return Promise.reject(new Error("WebSocket connection is not open"));
            }
            return new Promise((resolve, reject) => {
                websocketBridge.send(this.id, String(data), raw => {
                    const payload = JSON.parse(String(raw));
                    if (payload.error) reject(new Error(String(payload.error)));
                    else resolve();
                });
            });
        }
        sendJson(value) {
            return this.send(JSON.stringify(value));
        }
        close(code = 1000, reason = "") {
            if (this.readyState === "CLOSED") return Promise.resolve();
            this.readyState = "CLOSING";
            return new Promise((resolve, reject) => {
                websocketBridge.close(this.id, Number(code), String(reason), raw => {
                    const payload = JSON.parse(String(raw));
                    if (payload.error) reject(new Error(String(payload.error)));
                    else resolve();
                });
            });
        }
        _emit(type, event) {
            for (const listener of Array.from(this._listeners.get(type) || [])) {
                try {
                    Promise.resolve(listener(event)).catch(failure => bridge.error(
                        failure && failure.stack ? failure.stack : String(failure)
                    ));
                } catch (failure) {
                    bridge.error(failure && failure.stack ? failure.stack : String(failure));
                }
            }
        }
        _handle(event) {
            if (event.type === "open") {
                this.readyState = "OPEN";
                if (!this._settled) {
                    this._settled = true;
                    this._resolveOpen(this);
                }
                this._emit("open", event);
                return;
            }
            if (event.type === "close") {
                this.readyState = "CLOSED";
                this._emit("close", event);
                return;
            }
            if (event.type === "error") {
                this.readyState = "CLOSED";
                const failure = new Error(String(event.error || "WebSocket connection failed"));
                if (!this._settled) {
                    this._settled = true;
                    this._rejectOpen(failure);
                }
                this._emit("error", Object.freeze({ ...event, error: failure }));
                return;
            }
            this._emit(String(event.type), event);
        }
    }

    const websocket = Object.freeze({
        connect(url, options = {}) {
            const selected = options || {};
            const headers = { ...(selected.headers || {}) };
            return new Promise((resolve, reject) => {
                let connection = null;
                const queued = [];
                const id = websocketBridge.open(
                    String(url), JSON.stringify(headers), Number(selected.timeout || 15000), raw => {
                        const event = Object.freeze(JSON.parse(String(raw)));
                        if (connection == null) queued.push(event);
                        else connection._handle(event);
                    }
                );
                connection = new GraalyWebSocketConnection(id, resolve, reject);
                for (const event of queued) connection._handle(event);
            });
        }
    });

    const ui = Object.freeze({
        render(player, snapshot, onAction = () => {}) {
            if (snapshot == null || typeof snapshot !== "object") {
                throw new TypeError("ui.render snapshot must be an object");
            }
            if (typeof onAction !== "function") {
                throw new TypeError("ui.render onAction must be a function");
            }
            uiBridge.render(unwrap(player), JSON.stringify(snapshot), raw =>
                onAction(JSON.parse(String(raw))));
        },
        renderHtml(player, markup, options = {}) {
            if (typeof markup !== "string") {
                throw new TypeError("ui.renderHtml markup must be a string");
            }
            if (options == null || typeof options !== "object" || Array.isArray(options)) {
                throw new TypeError("ui.renderHtml options must be an object");
            }
            const actions = options.actions || {};
            if (actions == null || typeof actions !== "object" || Array.isArray(actions)) {
                throw new TypeError("ui.renderHtml actions must be an object");
            }
            if (options.onAction != null && typeof options.onAction !== "function") {
                throw new TypeError("ui.renderHtml onAction must be a function");
            }
            const snapshot = JSON.parse(String(uiBridge.compileHtml(markup, String(options.css || ""))));
            ui.render(player, snapshot, action => {
                const selected = actions[action.actionId];
                for (const handler of [selected, options.onAction]) {
                    if (typeof handler !== "function") continue;
                    try {
                        Promise.resolve(handler(action)).catch(failure => bridge.error(
                            failure && failure.stack ? failure.stack : String(failure)
                        ));
                    } catch (failure) {
                        bridge.error(failure && failure.stack ? failure.stack : String(failure));
                    }
                }
            });
        },
        clear(player) {
            uiBridge.clear(unwrap(player));
        },
        dismiss(player, surface) {
            uiBridge.dismiss(unwrap(player), String(surface));
        }
    });

    const config = Object.freeze({
        get: (path, fallback = null) => {
            const value = rawPlugin.getConfig().get(String(path));
            return value == null ? fallback : native(value);
        },
        set: (path, value) => rawPlugin.getConfig().set(String(path), unwrap(value)),
        contains: path => rawPlugin.getConfig().contains(String(path)),
        save: () => rawPlugin.saveConfig(),
        reload: () => rawPlugin.reloadConfig()
    });

    const players = Object.freeze({
        [Symbol.iterator]() {
            return players.online()[Symbol.iterator]();
        },
        online: () => array(rawServer.getOnlinePlayers()).map(native),
        get: name => native(rawServer.getPlayer(String(name))),
        exact: name => native(rawServer.getPlayerExact(String(name))),
        isPlayer: value => bridge.namedApiType("Player").isInstance(unwrap(value)),
        broadcast: message => bridge.broadcast(message)
    });

    const boards = Object.freeze({
        get available() {
            return Boolean(bridge.webBoardsAvailable());
        },
        state(name, player, data = {}) {
            if (data == null || typeof data !== "object" || Array.isArray(data)) {
                throw new TypeError("boards.state data must be an object");
            }
            bridge.publishWebState(String(name), unwrap(player), JSON.stringify(data));
        },
        onMessage(name, callback) {
            if (typeof callback !== "function") {
                throw new TypeError("boards.onMessage expects a function");
            }
            bridge.onWebMessage(String(name), raw => callback(JSON.parse(String(raw))));
            return callback;
        },
        listen(name) {
            return callback => boards.onMessage(name, callback);
        },
        refresh(name, player) {
            bridge.refreshWebBoard(String(name), unwrap(player));
        }
    });

    const worlds = Object.freeze({
        [Symbol.iterator]() {
            return worlds.all()[Symbol.iterator]();
        },
        all: () => array(rawServer.getWorlds()).map(native),
        get: name => native(rawServer.getWorld(String(name))),
        location(world, x, y, z, yaw = 0, pitch = 0) {
            return bukkit.Location(
                unwrap(world), finiteNumber(x, "x"), finiteNumber(y, "y"), finiteNumber(z, "z"),
                finiteNumber(yaw, "yaw"), finiteNumber(pitch, "pitch")
            );
        },
        create(name, options = {}) {
            const selected = options || {};
            const creator = bukkit.WorldCreator(String(name));
            if (selected.seed != null) creator.seed(safeInteger(selected.seed, "seed"));
            if (selected.environment != null) {
                const environment = typeof selected.environment === "string"
                    ? bukkit.World.Environment.valueOf(selected.environment.toUpperCase())
                    : selected.environment;
                creator.environment(unwrap(environment));
            }
            if (selected.type != null) {
                const worldType = typeof selected.type === "string"
                    ? bukkit.WorldType.valueOf(selected.type.toUpperCase())
                    : selected.type;
                creator.type(unwrap(worldType));
            }
            if (selected.generateStructures != null) {
                creator.generateStructures(Boolean(selected.generateStructures));
            }
            if (selected.generatorSettings != null) {
                creator.generatorSettings(String(selected.generatorSettings));
            }
            if (selected.generator != null) creator.generator(unwrap(selected.generator));
            return native(creator.createWorld());
        },
        generator(definition) {
            const selected = typeof definition === "function" ? { generate: definition } : (definition || {});
            if (typeof selected.generate !== "function") {
                throw new TypeError("worlds.generator requires a generate callback");
            }
            const generate = (world, random, chunkX, chunkZ, biomes, chunk) =>
                selected.generate(Object.freeze({
                    world: native(world),
                    random: native(random),
                    chunkX: Number(chunkX),
                    chunkZ: Number(chunkZ),
                    biomes: native(biomes),
                    chunk: native(chunk)
                }));
            const canSpawn = typeof selected.canSpawn === "function"
                ? (world, x, z) => selected.canSpawn(Object.freeze({
                    world: native(world), x: Number(x), z: Number(z)
                }))
                : null;
            const defaultPopulators = selected.defaultPopulators == null
                ? null
                : world => {
                    const result = typeof selected.defaultPopulators === "function"
                        ? selected.defaultPopulators(native(world))
                        : selected.defaultPopulators;
                    return result == null ? [] : Array.from(result, unwrap);
                };
            const fixedSpawn = typeof selected.fixedSpawn === "function"
                ? (world, random) => unwrap(selected.fixedSpawn(Object.freeze({
                    world: native(world), random: native(random)
                })))
                : null;
            return native(bridge.worldGenerator(generate, canSpawn, defaultPopulators, fixedSpawn));
        },
        populator(callback) {
            if (typeof callback !== "function") {
                throw new TypeError("worlds.populator requires a callback");
            }
            return native(bridge.blockPopulator((world, random, chunk) => callback(Object.freeze({
                world: native(world),
                random: native(random),
                chunk: native(chunk)
            }))));
        },
        unload(worldOrName, save = true) {
            const rawWorld = typeof worldOrName === "string"
                ? rawServer.getWorld(worldOrName)
                : unwrap(worldOrName);
            return rawWorld != null && rawServer.unloadWorld(rawWorld, Boolean(save));
        }
    });

    const canonicalConstant = (value, label) => {
        const name = String(value).trim().toUpperCase().replace(/[\s-]+/g, "_");
        if (!name) throw new TypeError(`${label} cannot be empty`);
        return name;
    };

    /** Stable entity facade. Version-specific enum names stay behind Graaly. */
    const entities = Object.freeze({
        type(name) {
            return bukkit.EntityType[canonicalConstant(name, "entity type")];
        },
        attributeType(name) {
            compatibility.require("attributes");
            return bukkit.Attribute[canonicalConstant(name, "attribute")];
        },
        spawn(location, type, options = {}) {
            const rawLocation = unwrap(location);
            const rawWorld = bridge.invokePacked(rawLocation, "getWorld", []);
            if (rawWorld == null) throw new TypeError("entities.spawn requires a location with a world");
            const selectedType = typeof type === "string" ? entities.type(type) : type;
            const entity = native(bridge.invokePacked(
                rawWorld, "spawnEntity", [rawLocation, unwrap(selectedType)]
            ));
            return entities.configure(entity, options);
        },
        configure(entity, options = {}) {
            if (options == null || typeof options !== "object" || Array.isArray(options)) {
                throw new TypeError("entities.configure options must be an object");
            }
            const rawEntity = unwrap(entity);
            const call = (method, value) => bridge.invokePacked(rawEntity, method, [value]);
            const customName = options.customName !== undefined ? options.customName : options.name;
            if (customName !== undefined) call("setCustomName", customName == null ? null : String(customName));
            const nameVisible = options.customNameVisible !== undefined
                ? options.customNameVisible : options.nameVisible;
            if (nameVisible !== undefined) call("setCustomNameVisible", Boolean(nameVisible));
            for (const [name, value] of Object.entries(options.attributes || {})) {
                entities.attribute(entity, name, value);
            }
            for (const [option, feature, method] of [
                ["ai", "entity_ai", "setAI"],
                ["invulnerable", "entity_invulnerable", "setInvulnerable"],
                ["gravity", "entity_gravity", "setGravity"],
                ["glowing", "glowing", "setGlowing"]
            ]) {
                if (options[option] === undefined) continue;
                compatibility.require(feature);
                call(method, Boolean(options[option]));
            }
            return native(rawEntity);
        },
        attribute(entity, name, baseValue) {
            compatibility.require("attributes");
            const selected = typeof name === "string" ? entities.attributeType(name) : name;
            const rawInstance = bridge.invokePacked(
                unwrap(entity), "getAttribute", [unwrap(selected)]
            );
            if (rawInstance == null) {
                throw new TypeError(`The entity does not expose attribute ${String(name)}`);
            }
            if (arguments.length >= 3) {
                bridge.invokePacked(rawInstance, "setBaseValue", [finiteNumber(baseValue, "baseValue")]);
            }
            return native(rawInstance);
        },
        remove(entity) {
            bridge.invokePacked(unwrap(entity), "remove", []);
        }
    });

    const adapters = Object.freeze({
        extend(type, handlers, ...constructorArgs) {
            if (handlers == null || typeof handlers !== "object") {
                throw new TypeError("adapters.extend requires an object of callback methods");
            }
            const adapted = {};
            for (const [name, callback] of Object.entries(handlers)) {
                if (typeof callback !== "function") continue;
                adapted[name] = (...rawArgs) => unwrap(callback(...rawArgs.map(native)));
            }
            return native(bridge.adaptPacked(unwrap(type), adapted, constructorArgs.map(unwrap)));
        },
        implement(type, handlers) {
            return adapters.extend(type, handlers);
        }
    });

    const text = Object.freeze({
        color: message => bridge.color(message)
    });

    const packetBridge = bridge.getPackets();
    const packetOptions = options => ({
        priority: options && options.priority ? String(options.priority) : "NORMAL"
    });

    const packetTypeTree = {};
    for (const rawPath of array(packetBridge.getPacketTypePaths())) {
        const path = String(rawPath);
        const parts = path.split(".");
        let node = packetTypeTree;
        for (let index = 0; index < parts.length - 1; index++) {
            node = node[parts[index]] || (node[parts[index]] = {});
        }
        const leaf = parts[parts.length - 1];
        let resolved = false;
        let value;
        Object.defineProperty(node, leaf, {
            enumerable: true,
            configurable: false,
            get() {
                if (!resolved) {
                    value = packetBridge.packetType(path);
                    resolved = true;
                }
                return value;
            }
        });
    }
    const freezeTree = node => {
        for (const key of Object.keys(node)) {
            const descriptor = Object.getOwnPropertyDescriptor(node, key);
            if (descriptor && "value" in descriptor && descriptor.value && typeof descriptor.value === "object") {
                freezeTree(descriptor.value);
            }
        }
        return Object.freeze(node);
    };
    const PacketType = freezeTree(packetTypeTree);
    const Handshaking = PacketType.Handshaking;
    const Status = PacketType.Status;
    const Login = PacketType.Login;
    const ConfigurationPackets = PacketType.Configuration;
    const Play = PacketType.Play;
    const ClientPacket = PacketType.Play.Client;
    const ServerPacket = PacketType.Play.Server;

    const wrapperFactory = exportedName => {
        let rawType = null;
        const resolveType = () => rawType || (rawType = packetBridge.wrapperType(exportedName));
        const construct = (...args) => native(packetBridge.createPacked(resolveType(), args.map(unwrap)));
        return new Proxy(construct, {
            apply(_target, _thisArg, args) {
                return construct(...args);
            },
            construct(_target, args) {
                return construct(...args);
            },
            get(target, property) {
                if (property === CLASS) return resolveType();
                if (property === "displayName") return exportedName;
                if (typeof property === "symbol") return Reflect.get(target, property);
                const type = resolveType();
                const name = String(property);
                if (bridge.hasStaticMember(type, name)) {
                    const member = bridge.staticMember(type, name);
                    return bridge.isType(member) ? typeView(member, `${exportedName}.${name}`) : native(member);
                }
                if (bridge.hasMethod(type, name)) {
                    return (...args) => native(bridge.invokePacked(type, name, args.map(unwrap)));
                }
                try {
                    return native(type[name]);
                } catch (_) {
                    return undefined;
                }
            }
        });
    };
    const wrappers = makeLazyCatalog(packetBridge.getWrapperTypeNames(), wrapperFactory);
    const packetTypes = makeLazyCatalog(
        packetBridge.getTypeNames(),
        name => typeView(packetBridge.namedType(name), name)
    );

    const packetContext = (raw, direction) => Object.freeze({
        [RAW]: raw,
        direction,
        packetType: raw.getPacketType(),
        packetName: String(raw.getPacketName()),
        user: native(raw.getUser()),
        player: native(raw.getPlayer()),
        clientVersion: native(raw.getClientVersion()),
        isCancelled: () => raw.isCancelled(),
        cancel: (cancelled = true) => raw.setCancelled(Boolean(cancelled)),
        reencode: () => raw.markForReEncode(true),
        wrap: wrapperType => native(packetBridge.wrap(unwrap(wrapperType), raw))
    });

    const synchronousPacketCallback = callback => {
        if (typeof callback !== "function") {
            throw new TypeError("Packet callback must be a function");
        }
        // GraalJS does not consistently expose AsyncFunction through
        // callback.constructor.name.  The intrinsic tag and source form are
        // stable across GraalJS and browser/Node hosts, so keep all three
        // checks and retain the return-value guard below as a final defence.
        let tag = "";
        let source = "";
        try {
            tag = Object.prototype.toString.call(callback);
            source = Function.prototype.toString.call(callback).trimStart();
        } catch (_) {
            // Host functions can deny reflection. They are still checked when
            // invoked: returning a thenable is never accepted by the bridge.
        }
        const constructorName = callback.constructor?.name;
        const asyncSource = /^async(?:\s+function\b|\s*\([^)]*\)\s*=>|\s+[A-Za-z_$][\w$]*\s*=>)/.test(source);
        const generatorSource = /^(?:async\s+)?function\s*\*/.test(source);
        if (constructorName === "AsyncFunction" || constructorName === "GeneratorFunction"
                || constructorName === "AsyncGeneratorFunction"
                || tag === "[object AsyncFunction]" || tag === "[object GeneratorFunction]"
                || tag === "[object AsyncGeneratorFunction]" || asyncSource || generatorSource) {
            throw new TypeError(
                "Packet listeners must be synchronous because PacketEvents must finish reading, "
                + "changing, or cancelling a packet before the network pipeline continues. "
                + "Start follow-up work without returning its Promise."
            );
        }
        return callback;
    };

    const packetCallbackAdapter = (callback, direction) => {
        let disabled = false;
        return raw => {
            if (disabled) return;
            const context = packetContext(raw, direction);
            try {
                const result = callback(context);
                if (result === undefined) return;

                disabled = true;
                // Close/silence lazy and asynchronous return values so they do
                // not produce unhandled rejections after the listener has been
                // quarantined. PacketEvents itself always continues normally.
                try {
                    if (result != null && typeof result.return === "function") {
                        const closing = result.return();
                        if (closing != null && typeof closing.then === "function") {
                            Promise.resolve(closing).catch(() => undefined);
                        }
                    } else if (result != null && typeof result.then === "function") {
                        Promise.resolve(result).catch(() => undefined);
                    }
                } catch (_) {
                    // The single contract error below is the useful diagnostic.
                }
                bridge.error(
                    `Disabled ${direction} packet listener for ${context.packetName}: `
                    + "listeners must finish synchronously and return undefined. "
                    + "Start follow-up work without returning its Promise or iterator."
                );
            } catch (failure) {
                disabled = true;
                bridge.error(
                    `Disabled ${direction} packet listener for ${context.packetName} after it threw: `
                    + (failure instanceof Error ? failure.stack || failure.message : String(failure))
                );
            }
        };
    };

    const packets = Object.freeze({
        get available() {
            return packetBridge.isAvailable();
        },
        get version() {
            return packetBridge.isAvailable() ? String(packetBridge.getVersion()) : null;
        },
        PacketType,
        Handshaking,
        Status,
        Login,
        ConfigurationPackets,
        Play,
        Client: ClientPacket,
        Server: ServerPacket,
        create: (wrapperType, ...args) => native(packetBridge.create(unwrap(wrapperType), ...args.map(unwrap))),
        wrap: (wrapperType, event) => native(packetBridge.wrap(unwrap(wrapperType), unwrap(event))),
        onReceive(packetType, callback, options = {}) {
            if (typeof packetType === "function" && packetType[CLASS] == null) {
                options = callback || {};
                callback = packetType;
                packetType = null;
            }
            const selected = packetOptions(options);
            callback = synchronousPacketCallback(callback);
            const adapted = packetCallbackAdapter(callback, "receive");
            packetBridge.onReceive(unwrap(packetType), selected.priority, adapted);
            return callback;
        },
        listenReceive(packetType = null, options = {}) {
            return callback => packets.onReceive(packetType, callback, options);
        },
        onSend(packetType, callback, options = {}) {
            if (typeof packetType === "function" && packetType[CLASS] == null) {
                options = callback || {};
                callback = packetType;
                packetType = null;
            }
            const selected = packetOptions(options);
            callback = synchronousPacketCallback(callback);
            const adapted = packetCallbackAdapter(callback, "send");
            packetBridge.onSend(unwrap(packetType), selected.priority, adapted);
            return callback;
        },
        listenSend(packetType = null, options = {}) {
            return callback => packets.onSend(packetType, callback, options);
        },
        send(player, packet, options = {}) {
            if (options.silent) packetBridge.sendSilently(unwrap(player), unwrap(packet));
            else packetBridge.send(unwrap(player), unwrap(packet));
        },
        sendToAll(packet, options = {}) {
            for (const player of players.online()) packets.send(player, packet, options);
        },
        receive(player, packet, options = {}) {
            if (options.silent) packetBridge.receiveSilently(unwrap(player), unwrap(packet));
            else packetBridge.receive(unwrap(player), unwrap(packet));
        },
        user: player => native(packetBridge.user(unwrap(player))),
        clientVersion: player => native(packetBridge.clientVersion(unwrap(player))),
        ping: player => packetBridge.ping(unwrap(player))
    });

    const countPacketConstants = () => Object.values(PacketType).reduce((total, phase) =>
        total + Object.values(phase).reduce((phaseTotal, direction) =>
            phaseTotal + Object.keys(direction).length, 0), 0);

    /** Stable-version contract and explicit capability checks. */
    const compatibility = Object.freeze({
        contractVersion: String(bridge.contractVersion()),
        minimumGameVersion: String(bridge.minimumGameVersion()),
        minecraftVersion: String(bridge.minecraftVersion()),
        serverVersion: String(bridge.serverVersion()),
        supports: feature => Boolean(bridge.supports(String(feature))),
        require: feature => graalyCall(() => bridge.requireFeature(String(feature))),
        typeAvailable: name => Boolean(bridge.typeAvailable(String(name))),
        material: name => native(graalyCall(() => bridge.material(String(name))))
    });

    /** Runtime integrity checks exposed without leaking any host-language object. */
    const diagnostics = Object.freeze({
        verify() {
            for (const symbol of Object.values(bukkit)) unwrap(symbol);
            for (const symbol of Object.values(wrappers)) unwrap(symbol);
            for (const symbol of Object.values(packetTypes)) unwrap(symbol);
            return Object.freeze({
                apiSymbols: Object.keys(bukkit).length,
                wrappers: Object.keys(wrappers).length,
                packetTypes: Object.keys(packetTypes).length,
                packetConstants: countPacketConstants()
            });
        }
    });

    const defineGlobal = (name, getter) => {
        if (Object.prototype.hasOwnProperty.call(global, name)) return;
        Object.defineProperty(global, name, {
            enumerable: false,
            configurable: false,
            get: getter
        });
    };

    // Zero-build JavaScript gets the same discoverable symbols as the package SDK.
    for (const name of Object.keys(bukkit)) defineGlobal(name, () => bukkit[name]);
    for (const name of Object.keys(packetTypes)) defineGlobal(name, () => packetTypes[name]);
    for (const name of Object.keys(wrappers)) defineGlobal(name, () => wrappers[name]);
    for (const [name, value] of Object.entries({
        plugin: native(rawPlugin),
        server: native(rawServer),
        logger: native(rawLogger),
        dataFolder: native(rawDataFolder),
        events, commands, tasks, http, websocket, ui, config, players, boards, worlds, entities, constants, compatibility, adapters, text, packets, diagnostics,
        ...constantGlobals,
        GraalyUnsupportedFeature,
        PacketType, Handshaking, Status, Login, ConfigurationPackets, Play,
        ClientPacket, ServerPacket,
        dataFile: path => native(bridge.dataFile(path)),
        // Java void is exposed as null by some GraalJS host calls. Keep these
        // helpers genuinely JavaScript-like so concise callbacks such as
        // `() => info("received")` still return undefined.
        info: message => { bridge.info(message); },
        warn: message => { bridge.warn(message); },
        error: message => { bridge.error(message); }
    })) defineGlobal(name, () => value);
})(globalThis);
