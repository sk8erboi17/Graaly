package io.github.sk8erboi17.graaly.polyglot;

import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.event.Event;
import org.bukkit.event.EventException;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.entity.Player;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.generator.BlockPopulator;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.EventExecutor;
import org.bukkit.scheduler.BukkitTask;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.proxy.ProxyExecutable;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;
import java.util.logging.Level;

/**
 * Small, language-neutral facade exported to GraalJS and GraalPy as the
 * the language bootstrap. Script plugins are trusted to the same extent as JAR
 * plugins; this facade is about ergonomics, not a security boundary.
 */
public final class GraalyScriptApi {
    private final PolyglotPlugin plugin;
    private final GraalyCompatibility compatibility;
    private final Listener listener = new Listener() { };
    private final PacketEventsScriptApi packets;
    private final GraalyHttpScriptApi http;
    private final GraalyWebSocketScriptApi websocket;
    private final GraalyUiScriptApi ui;
    private final List<EventBinding> events = new ArrayList<>();
    private final Map<String, Value> commands = new LinkedHashMap<>();
    private final Map<String, Value> tabCompleters = new LinkedHashMap<>();
    private final List<WebsiteMessageBinding> websiteListeners = new ArrayList<>();
    private final List<AutoCloseable> websiteBindings = new ArrayList<>();
    private Value pythonTaskActivate;
    private Value pythonTaskPump;
    private Value pythonTaskShutdown;
    private Value pythonAwaitableHandler;
    private BukkitTask pythonTaskPumpTask;
    private boolean pythonTasksClosed;
    private boolean active;

    GraalyScriptApi(PolyglotPlugin plugin) {
        this.plugin = plugin;
        this.compatibility = new GraalyCompatibility(plugin);
        this.packets = new PacketEventsScriptApi(plugin);
        this.http = new GraalyHttpScriptApi(plugin);
        this.websocket = new GraalyWebSocketScriptApi(plugin);
        this.ui = new GraalyUiScriptApi(plugin, compatibility);
    }

    public PacketEventsScriptApi getPackets() {
        return packets;
    }

    public PacketEventsScriptApi get_packets() {
        return getPackets();
    }

    public GraalyHttpScriptApi getHttp() {
        return http;
    }

    public GraalyHttpScriptApi get_http() {
        return getHttp();
    }

    public GraalyWebSocketScriptApi getWebSocket() {
        return websocket;
    }

    public GraalyWebSocketScriptApi get_websocket() {
        return getWebSocket();
    }

    public GraalyUiScriptApi getUi() {
        return ui;
    }

    public GraalyUiScriptApi get_ui() {
        return getUi();
    }

    /**
     * Resolve a discoverable SDK export such as {@code Material} or
     * {@code PlayerJoinEvent}. Only names generated into the SDK catalog are
     * accepted; arbitrary class lookup is deliberately unavailable.
     */
    public Class<?> namedApiType(String exportedName) {
        if (exportedName == null || exportedName.trim().isEmpty()) {
            throw new IllegalArgumentException("Graaly API symbol cannot be empty");
        }
        String normalized = exportedName.trim();
        String className = PolyglotTypeCatalog.apiClass(normalized);
        if (className == null) {
            throw new IllegalArgumentException("Unknown Graaly API symbol " + normalized);
        }
        try {
            return resolveClass(className);
        } catch (ClassNotFoundException | LinkageError unavailable) {
            throw compatibility.missingType(normalized, className);
        }
    }

    public Class<?> named_api_type(String exportedName) {
        return namedApiType(exportedName);
    }

    private Class<?> resolveClass(String className) throws ClassNotFoundException {
        return Class.forName(className, true, plugin.getHostClassLoader());
    }

    public String[] getApiTypeNames() {
        return PolyglotTypeCatalog.apiNames();
    }

    public String[] get_api_type_names() {
        return getApiTypeNames();
    }

    public String[] getConstantNamespaceNames() {
        return PolyglotTypeCatalog.constantNamespaceNames();
    }

    public String[] get_constant_namespace_names() {
        return getConstantNamespaceNames();
    }

    public String[] getConstantNames(String namespace) {
        return PolyglotTypeCatalog.constantNames(namespace);
    }

    public String[] get_constant_names(String namespace) {
        return getConstantNames(namespace);
    }

    public Object namedConstant(String namespace, String name) {
        String selectedNamespace = namespace == null ? "" : namespace.trim();
        String selectedName = name == null ? "" : name.trim().toUpperCase(java.util.Locale.ENGLISH);
        if (!PolyglotTypeCatalog.hasConstant(selectedNamespace, selectedName)) {
            throw new IllegalArgumentException("Unknown Graaly constant "
                    + selectedNamespace + "." + selectedName);
        }
        String className = PolyglotTypeCatalog.constantRuntimeType(selectedNamespace);
        try {
            return compatibility.portableConstant(resolveClass(className), selectedName);
        } catch (ClassNotFoundException | LinkageError unavailable) {
            throw compatibility.missingType(selectedNamespace, className);
        }
    }

    public Object named_constant(String namespace, String name) {
        return namedConstant(namespace, name);
    }

    /** Construct a Java-backed SDK type with guest-number and collection conversion. */
    public Object construct(Object type, Object... arguments) {
        return HostInterop.construct(type, arguments);
    }

    public Object constructPacked(Object type, Object arguments) {
        return HostInterop.construct(type, HostInterop.packedArguments(arguments));
    }

    public Object construct_packed(Object type, Object arguments) {
        return constructPacked(type, arguments);
    }

    /** Implement an interface or extend an abstract API class with guest-language callbacks. */
    public Object adapt(Object type, Value handlers, Object... constructorArguments) {
        return ScriptObjectAdapter.create(plugin, type, handlers, constructorArguments);
    }

    public Object adaptPacked(Object type, Value handlers, Object constructorArguments) {
        return adapt(type, handlers, HostInterop.packedArguments(constructorArguments));
    }

    public Object adapt_packed(Object type, Value handlers, Object constructorArguments) {
        return adaptPacked(type, handlers, constructorArguments);
    }

    /** Invoke a Java-backed SDK method while unwrapping native language views. */
    public Object invoke(Object target, String method, Object... arguments) {
        return HostInterop.invoke(target, method, arguments);
    }

    public Object invokePacked(Object target, String method, Object arguments) {
        return HostInterop.invoke(target, method, HostInterop.packedArguments(arguments));
    }

    public Object invoke_packed(Object target, String method, Object arguments) {
        return invokePacked(target, method, arguments);
    }

    public boolean hasMethod(Object target, String method) {
        return HostInterop.hasMethod(target, method);
    }

    public boolean has_method(Object target, String method) {
        return hasMethod(target, method);
    }

    public boolean hasStaticMember(Object type, String name) {
        return HostInterop.hasStaticMember(type, name)
                || compatibility.canRequestPortableConstant(type, name);
    }

    public boolean has_static_member(Object type, String name) {
        return hasStaticMember(type, name);
    }

    public Object staticMember(Object type, String name) {
        if (compatibility.canRequestPortableConstant(type, name)) {
            return compatibility.portableConstant(type, name);
        }
        return HostInterop.staticMember(type, name);
    }

    public Object static_member(Object type, String name) {
        return staticMember(type, name);
    }

    public String minecraftVersion() {
        return compatibility.minecraftVersion();
    }

    public String minecraft_version() {
        return minecraftVersion();
    }

    public String serverVersion() {
        return compatibility.serverVersion();
    }

    public String server_version() {
        return serverVersion();
    }

    public String contractVersion() {
        return compatibility.contractVersion();
    }

    public String contract_version() {
        return contractVersion();
    }

    public String minimumGameVersion() {
        return compatibility.minimumGameVersion();
    }

    public String minimum_game_version() {
        return minimumGameVersion();
    }

    public boolean supports(String feature) {
        return compatibility.supports(feature);
    }

    public void requireFeature(String feature) {
        compatibility.require(feature);
    }

    public void require_feature(String feature) {
        requireFeature(feature);
    }

    public boolean typeAvailable(String exportedName) {
        return compatibility.typeAvailable(exportedName);
    }

    public boolean type_available(String exportedName) {
        return typeAvailable(exportedName);
    }

    public Material material(String canonicalName) {
        return compatibility.material(canonicalName);
    }

    public boolean isType(Object value) {
        return HostInterop.isType(value);
    }

    public boolean is_type(Object value) {
        return isType(value);
    }

    public Object property(Object target, String name) {
        return HostInterop.property(target, name);
    }

    public boolean hasProperty(Object target, String name) {
        return HostInterop.hasProperty(target, name);
    }

    public boolean has_property(Object target, String name) {
        return hasProperty(target, name);
    }

    public void setProperty(Object target, String name, Object value) {
        HostInterop.setProperty(target, name, value);
    }

    public void set_property(Object target, String name, Object value) {
        setProperty(target, name, value);
    }

    public boolean hasWritableProperty(Object target, String name) {
        return HostInterop.hasWritableProperty(target, name);
    }

    public boolean hasCanonicalInstanceMember(Object target, String name) {
        return PolyglotTypeCatalog.canonicalInstanceOwner(target, name) != null;
    }

    public boolean has_canonical_instance_member(Object target, String name) {
        return hasCanonicalInstanceMember(target, name);
    }

    public boolean hasCanonicalWritableMember(Object target, String name) {
        return PolyglotTypeCatalog.canonicalWritableOwner(target, name) != null;
    }

    public boolean has_canonical_writable_member(Object target, String name) {
        return hasCanonicalWritableMember(target, name);
    }

    public boolean hasCanonicalStaticMember(Object target, String name) {
        return PolyglotTypeCatalog.canonicalStaticOwner(target, name) != null;
    }

    public boolean has_canonical_static_member(Object target, String name) {
        return hasCanonicalStaticMember(target, name);
    }

    public Object unavailableInstanceMember(Object target, String name) {
        throw compatibility.missingMember(
                PolyglotTypeCatalog.canonicalInstanceOwner(target, name), name);
    }

    public Object unavailable_instance_member(Object target, String name) {
        return unavailableInstanceMember(target, name);
    }

    public Object unavailableStaticMember(Object target, String name) {
        throw compatibility.missingMember(
                PolyglotTypeCatalog.canonicalStaticOwner(target, name), name);
    }

    public Object unavailable_static_member(Object target, String name) {
        return unavailableStaticMember(target, name);
    }

    public boolean has_writable_property(Object target, String name) {
        return hasWritableProperty(target, name);
    }

    public boolean isCollection(Object value) {
        return HostInterop.isCollection(value);
    }

    public boolean is_collection(Object value) {
        return isCollection(value);
    }

    public Object[] collectionValues(Object value) {
        return HostInterop.collectionValues(value);
    }

    public Object[] collection_values(Object value) {
        return collectionValues(value);
    }

    public String collectionKind(Object value) {
        return HostInterop.collectionKind(value);
    }

    public String collection_kind(Object value) {
        return collectionKind(value);
    }

    public int collectionSize(Object value) {
        return HostInterop.collectionSize(value);
    }

    public int collection_size(Object value) {
        return collectionSize(value);
    }

    public Object collectionGet(Object value, int index) {
        return HostInterop.collectionGet(value, index);
    }

    public Object collection_get(Object value, int index) {
        return collectionGet(value, index);
    }

    public void collectionSet(Object value, int index, Object replacement) {
        HostInterop.collectionSet(value, index, replacement);
    }

    public void collection_set(Object value, int index, Object replacement) {
        collectionSet(value, index, replacement);
    }

    public boolean collectionAdd(Object value, Object item) {
        return HostInterop.collectionAdd(value, item);
    }

    public boolean collection_add(Object value, Object item) {
        return collectionAdd(value, item);
    }

    public void collectionInsert(Object value, int index, Object item) {
        HostInterop.collectionInsert(value, index, item);
    }

    public void collection_insert(Object value, int index, Object item) {
        collectionInsert(value, index, item);
    }

    public Object collectionRemoveAt(Object value, int index) {
        return HostInterop.collectionRemoveAt(value, index);
    }

    public Object collection_remove_at(Object value, int index) {
        return collectionRemoveAt(value, index);
    }

    public boolean collectionRemoveValue(Object value, Object item) {
        return HostInterop.collectionRemoveValue(value, item);
    }

    public boolean collection_remove_value(Object value, Object item) {
        return collectionRemoveValue(value, item);
    }

    public boolean collectionContains(Object value, Object item) {
        return HostInterop.collectionContains(value, item);
    }

    public boolean collection_contains(Object value, Object item) {
        return collectionContains(value, item);
    }

    public void collectionClear(Object value) {
        HostInterop.collectionClear(value);
    }

    public void collection_clear(Object value) {
        collectionClear(value);
    }

    public boolean isMap(Object value) {
        return HostInterop.isMap(value);
    }

    public boolean is_map(Object value) {
        return isMap(value);
    }

    public Object[][] mapEntries(Object value) {
        return HostInterop.mapEntries(value);
    }

    public Object[][] map_entries(Object value) {
        return mapEntries(value);
    }

    public int mapSize(Object value) {
        return HostInterop.mapSize(value);
    }

    public int map_size(Object value) {
        return mapSize(value);
    }

    public boolean mapContainsKey(Object value, Object key) {
        return HostInterop.mapContainsKey(value, key);
    }

    public boolean map_contains_key(Object value, Object key) {
        return mapContainsKey(value, key);
    }

    public Object mapGet(Object value, Object key) {
        return HostInterop.mapGet(value, key);
    }

    public Object map_get(Object value, Object key) {
        return mapGet(value, key);
    }

    public Object mapPut(Object value, Object key, Object item) {
        return HostInterop.mapPut(value, key, item);
    }

    public Object map_put(Object value, Object key, Object item) {
        return mapPut(value, key, item);
    }

    public Object mapRemove(Object value, Object key) {
        return HostInterop.mapRemove(value, key);
    }

    public Object map_remove(Object value, Object key) {
        return mapRemove(value, key);
    }

    public void mapClear(Object value) {
        HostInterop.mapClear(value);
    }

    public void map_clear(Object value) {
        mapClear(value);
    }

    public boolean isOptional(Object value) {
        return HostInterop.isOptional(value);
    }

    public boolean is_optional(Object value) {
        return isOptional(value);
    }

    public Object optionalValue(Object value) {
        return HostInterop.optionalValue(value);
    }

    public Object optional_value(Object value) {
        return optionalValue(value);
    }

    public String color(Object message) {
        return ChatColor.translateAlternateColorCodes('&', String.valueOf(message));
    }

    public void broadcast(Object message) {
        plugin.getServer().broadcastMessage(color(message));
    }

    public long seconds(double seconds) {
        if (!Double.isFinite(seconds) || seconds < 0) {
            throw new IllegalArgumentException("seconds must be a finite non-negative number");
        }
        return Math.round(seconds * 20.0D);
    }

    public boolean isPrimaryThread() {
        return plugin.getServer().isPrimaryThread();
    }

    public boolean is_primary_thread() {
        return isPrimaryThread();
    }

    public File dataFile(String relativePath) {
        if (relativePath == null || relativePath.trim().isEmpty()) {
            throw new IllegalArgumentException("Data path cannot be empty");
        }
        Path root = plugin.getDataFolder().toPath().toAbsolutePath().normalize();
        Path candidate = root.resolve(relativePath.replace('\\', '/')).normalize();
        if (!candidate.startsWith(root)) {
            throw new IllegalArgumentException("Data path escapes the plugin folder: " + relativePath);
        }
        return candidate.toFile();
    }

    public File data_file(String relativePath) {
        return dataFile(relativePath);
    }

    public void info(Object message) {
        plugin.getLogger().info(String.valueOf(message));
    }

    public void warn(Object message) {
        plugin.getLogger().warning(String.valueOf(message));
    }

    public void error(Object message) {
        plugin.getLogger().severe(String.valueOf(message));
    }

    /** Optional GraalyBoard bridge. No GraalyBoard classes leak into a script context. */
    public boolean webBoardsAvailable() {
        Plugin provider = websitePlugin(false);
        if (provider == null) {
            return false;
        }
        Object result = invokeWebsite(provider, "websitesAvailable", new Class<?>[0]);
        return result instanceof Boolean && (Boolean) result;
    }

    public boolean web_boards_available() {
        return webBoardsAvailable();
    }

    public void publishWebState(String board, Object viewer, String stateJson) {
        Player player = requirePlayer(viewer);
        invokeWebsite(websitePlugin(true), "publishWebsiteState",
                new Class<?>[]{String.class, Player.class, String.class},
                board, player, stateJson);
    }

    public void publish_web_state(String board, Object viewer, String stateJson) {
        publishWebState(board, viewer, stateJson);
    }

    public synchronized void onWebMessage(String board, Value callback) {
        Value executable = requireExecutable(callback, "website message callback");
        WebsiteMessageBinding listener = new WebsiteMessageBinding(board, executable);
        websiteListeners.add(listener);
        if (active) {
            registerWebsite(listener);
        }
    }

    public void on_web_message(String board, Value callback) {
        onWebMessage(board, callback);
    }

    public void refreshWebBoard(String board, Object viewer) {
        Player player = requirePlayer(viewer);
        invokeWebsite(websitePlugin(true), "refreshWebsite",
                new Class<?>[]{String.class, Player.class}, board, player);
    }

    public void refresh_web_board(String board, Object viewer) {
        refreshWebBoard(board, viewer);
    }

    public void on(Object eventType, Value callback) {
        on(eventType, EventPriority.NORMAL.name(), false, callback);
    }

    public void on(Object eventType, String priority, Value callback) {
        on(eventType, priority, false, callback);
    }

    public synchronized void on(Object eventType, String priority, boolean ignoreCancelled, Value callback) {
        Class<? extends Event> eventClass = resolveEventClass(eventType);
        Value executable = requireExecutable(callback, "event callback");
        EventBinding binding = new EventBinding(eventClass, parsePriority(priority), ignoreCancelled, executable);
        events.add(binding);
        if (active) {
            register(binding);
        }
    }

    public ProxyExecutable event(final Object eventType) {
        return event(eventType, EventPriority.NORMAL.name(), false);
    }

    public ProxyExecutable event(final Object eventType, final String priority) {
        return event(eventType, priority, false);
    }

    public ProxyExecutable event(final Object eventType, final String priority, final boolean ignoreCancelled) {
        return arguments -> {
            if (arguments.length != 1) {
                throw new IllegalArgumentException("An event decorator requires exactly one function");
            }
            on(eventType, priority, ignoreCancelled, arguments[0]);
            return arguments[0];
        };
    }

    public synchronized void command(String name, Value callback) {
        commands.put(normalizeCommand(name), requireExecutable(callback, "command callback"));
    }

    public ProxyExecutable command(final String name) {
        return arguments -> {
            if (arguments.length != 1) {
                throw new IllegalArgumentException("A command decorator requires exactly one function");
            }
            command(name, arguments[0]);
            return arguments[0];
        };
    }

    public synchronized void tabComplete(String name, Value callback) {
        tabCompleters.put(normalizeCommand(name), requireExecutable(callback, "tab-completion callback"));
    }

    public void tab_complete(String name, Value callback) {
        tabComplete(name, callback);
    }

    public ProxyExecutable tabComplete(final String name) {
        return arguments -> {
            if (arguments.length != 1) {
                throw new IllegalArgumentException("A tab-completion decorator requires exactly one function");
            }
            tabComplete(name, arguments[0]);
            return arguments[0];
        };
    }

    public ProxyExecutable tab_complete(final String name) {
        return tabComplete(name);
    }

    /**
     * Create a Bukkit chunk generator backed by a guest-language callback.
     * The callback receives world, random, chunk X/Z, biome grid, and a fresh
     * ChunkData instance in that order.
     */
    public ChunkGenerator worldGenerator(Value callback) {
        return worldGenerator(callback, null, null, null);
    }

    public ChunkGenerator worldGenerator(Value generate, Value canSpawn,
                                         Value defaultPopulators, Value fixedSpawn) {
        return new ScriptChunkGenerator(
                plugin,
                requireExecutable(generate, "world generator generate callback"),
                optionalExecutable(canSpawn, "world generator canSpawn callback"),
                optionalExecutable(defaultPopulators, "world generator defaultPopulators callback"),
                optionalExecutable(fixedSpawn, "world generator fixedSpawn callback")
        );
    }

    public ChunkGenerator world_generator(Value callback) {
        return worldGenerator(callback);
    }

    public ChunkGenerator world_generator(Value generate, Value canSpawn,
                                          Value defaultPopulators, Value fixedSpawn) {
        return worldGenerator(generate, canSpawn, defaultPopulators, fixedSpawn);
    }

    public BlockPopulator blockPopulator(Value callback) {
        return new ScriptBlockPopulator(plugin, requireExecutable(callback, "block populator callback"));
    }

    public BlockPopulator block_populator(Value callback) {
        return blockPopulator(callback);
    }

    public BukkitTask run(Value callback) {
        return plugin.getServer().getScheduler().runTask(plugin.asPlugin(), runnable(callback, "scheduled callback"));
    }

    public BukkitTask later(long delay, Value callback) {
        requireNonNegative(delay, "delay");
        return plugin.getServer().getScheduler().runTaskLater(plugin.asPlugin(), runnable(callback, "delayed callback"), delay);
    }

    public BukkitTask repeat(long delay, long period, Value callback) {
        requireNonNegative(delay, "delay");
        if (period <= 0) {
            throw new IllegalArgumentException("period must be greater than zero");
        }
        return plugin.getServer().getScheduler().runTaskTimer(plugin.asPlugin(), runnable(callback, "repeating callback"), delay, period);
    }

    public BukkitTask runAsync(Value callback) {
        return plugin.getServer().getScheduler().runTaskAsynchronously(plugin.asPlugin(), runnable(callback, "asynchronous callback"));
    }

    public BukkitTask run_async(Value callback) {
        return runAsync(callback);
    }

    public BukkitTask laterAsync(long delay, Value callback) {
        requireNonNegative(delay, "delay");
        return plugin.getServer().getScheduler().runTaskLaterAsynchronously(plugin.asPlugin(), runnable(callback, "asynchronous delayed callback"), delay);
    }

    public BukkitTask later_async(long delay, Value callback) {
        return laterAsync(delay, callback);
    }

    public BukkitTask repeatAsync(long delay, long period, Value callback) {
        requireNonNegative(delay, "delay");
        if (period <= 0) {
            throw new IllegalArgumentException("period must be greater than zero");
        }
        return plugin.getServer().getScheduler().runTaskTimerAsynchronously(plugin.asPlugin(), runnable(callback, "asynchronous repeating callback"), delay, period);
    }

    public BukkitTask repeat_async(long delay, long period, Value callback) {
        return repeatAsync(delay, period, callback);
    }

    public void cancel(int taskId) {
        plugin.getServer().getScheduler().cancelTask(taskId);
    }

    public void cancel(BukkitTask task) {
        if (task != null) {
            task.cancel();
        }
    }

    /** Configure the per-plugin Python asyncio runtime installed by bootstrap.py. */
    public synchronized void configurePythonTasks(Value activate, Value pump,
                                                  Value shutdown, Value awaitableHandler) {
        if (pythonTaskActivate != null) {
            throw new IllegalStateException("Python task runtime is already configured");
        }
        pythonTaskActivate = requireExecutable(activate, "Python task activate callback");
        pythonTaskPump = requireExecutable(pump, "Python task pump callback");
        pythonTaskShutdown = requireExecutable(shutdown, "Python task shutdown callback");
        pythonAwaitableHandler = requireExecutable(awaitableHandler, "Python awaitable handler");
        pythonTasksClosed = false;
    }

    public void configure_python_tasks(Value activate, Value pump,
                                       Value shutdown, Value awaitableHandler) {
        configurePythonTasks(activate, pump, shutdown, awaitableHandler);
    }

    synchronized boolean handleAwaitable(Value result, String description) {
        if (pythonAwaitableHandler == null || result == null || result.isNull()) {
            return false;
        }
        Value handled = plugin.invoke(pythonAwaitableHandler, result, description);
        return handled != null && handled.isBoolean() && handled.asBoolean();
    }

    synchronized Value getCommand(String name) {
        return commands.get(normalizeCommand(name));
    }

    synchronized Value getTabCompleter(String name) {
        return tabCompleters.get(normalizeCommand(name));
    }

    synchronized void activate() {
        if (active) {
            return;
        }
        active = true;
        packets.activate();
        http.activate();
        websocket.activate();
        ui.activate();
        for (EventBinding binding : events) {
            register(binding);
        }
        for (WebsiteMessageBinding binding : websiteListeners) {
            registerWebsite(binding);
        }
        if (pythonTaskActivate != null && !pythonTasksClosed) {
            plugin.invoke(pythonTaskActivate);
            pythonTaskPumpTask = plugin.getServer().getScheduler().runTaskTimer(plugin.asPlugin(), new Runnable() {
                @Override
                public void run() {
                    try {
                        plugin.tryInvoke(pythonTaskPump);
                    } catch (Throwable throwable) {
                        plugin.getLogger().log(Level.SEVERE, "Could not advance the Python asyncio loop", throwable);
                    }
                }
            }, 1L, 1L);
        }
    }

    synchronized void deactivate() {
        active = false;
        ui.deactivate();
        websocket.deactivate();
        http.deactivate();
        packets.deactivate();
        closeWebsiteBindings();
        stopPythonTasks();
    }

    synchronized void clear() {
        active = false;
        ui.deactivate();
        websocket.deactivate();
        http.deactivate();
        packets.clear();
        closeWebsiteBindings();
        stopPythonTasks();
        events.clear();
        commands.clear();
        tabCompleters.clear();
        websiteListeners.clear();
        pythonTaskActivate = null;
        pythonTaskPump = null;
        pythonTaskShutdown = null;
        pythonAwaitableHandler = null;
    }

    private void stopPythonTasks() {
        if (pythonTaskPumpTask != null) {
            pythonTaskPumpTask.cancel();
            pythonTaskPumpTask = null;
        }
        if (!pythonTasksClosed && pythonTaskShutdown != null) {
            try {
                plugin.invoke(pythonTaskShutdown);
            } catch (Throwable throwable) {
                plugin.getLogger().log(Level.WARNING, "Could not shut down the Python asyncio loop cleanly", throwable);
            } finally {
                pythonTasksClosed = true;
            }
        }
    }

    private Plugin websitePlugin(boolean required) {
        Plugin provider = plugin.getServer().getPluginManager().getPlugin("GraalyBoard");
        if (provider == null || !provider.isEnabled()) {
            if (required) {
                throw new IllegalStateException("GraalyBoard is not installed or enabled");
            }
            return null;
        }
        return provider;
    }

    private Object invokeWebsite(Plugin provider, String methodName,
                                 Class<?>[] parameterTypes, Object... arguments) {
        try {
            Method method = provider.getClass().getMethod(methodName, parameterTypes);
            return method.invoke(provider, arguments);
        } catch (InvocationTargetException failure) {
            Throwable cause = failure.getCause() == null ? failure : failure.getCause();
            if (cause instanceof RuntimeException) {
                throw (RuntimeException) cause;
            }
            throw new IllegalStateException("GraalyBoard call failed: " + methodName, cause);
        } catch (ReflectiveOperationException failure) {
            throw new IllegalStateException("Installed GraalyBoard does not expose " + methodName,
                    failure);
        }
    }

    private Player requirePlayer(Object value) {
        Object unwrapped = HostInterop.unwrap(value);
        if (!(unwrapped instanceof Player)) {
            throw new IllegalArgumentException("board viewer must be a Player");
        }
        return (Player) unwrapped;
    }

    private void closeWebsiteBindings() {
        for (AutoCloseable binding : websiteBindings) {
            try {
                binding.close();
            } catch (Exception failure) {
                plugin.getLogger().log(Level.WARNING,
                        "Could not unregister a GraalyBoard message listener", failure);
            }
        }
        websiteBindings.clear();
    }

    private void registerWebsite(WebsiteMessageBinding listener) {
        Consumer<String> consumer = payload -> plugin.invoke(listener.callback, payload);
        Object binding = invokeWebsite(websitePlugin(true), "onWebsiteMessage",
                new Class<?>[]{String.class, Consumer.class}, listener.board, consumer);
        if (!(binding instanceof AutoCloseable)) {
            throw new IllegalStateException("GraalyBoard returned an invalid message binding");
        }
        websiteBindings.add((AutoCloseable) binding);
    }

    private void register(final EventBinding binding) {
        if (binding.registered) {
            return;
        }
        EventExecutor executor = new EventExecutor() {
            @Override
            public void execute(Listener ignored, Event event) throws EventException {
                try {
                    plugin.invoke(binding.callback, event);
                } catch (Throwable throwable) {
                    throw new EventException(throwable);
                }
            }
        };
        plugin.getServer().getPluginManager().registerEvent(
                binding.eventClass,
                listener,
                binding.priority,
                executor,
                plugin.asPlugin(),
                binding.ignoreCancelled
        );
        binding.registered = true;
    }

    private Runnable runnable(Value callback, String description) {
        final Value executable = requireExecutable(callback, description);
        return new Runnable() {
            @Override
            public void run() {
                plugin.invoke(executable);
            }
        };
    }

    private Value requireExecutable(Value callback, String description) {
        if (callback == null || !callback.canExecute()) {
            throw new IllegalArgumentException(description + " must be a function");
        }
        callback.pin();
        return callback;
    }

    private Value optionalExecutable(Value callback, String description) {
        if (callback == null || callback.isNull()) {
            return null;
        }
        return requireExecutable(callback, description);
    }

    @SuppressWarnings("unchecked")
    private Class<? extends Event> resolveEventClass(Object eventType) {
        Object resolved = HostInterop.unwrap(eventType);
        if (!(resolved instanceof Class)) {
            throw new IllegalArgumentException("Event type must be an imported Bukkit event symbol");
        }
        Class<?> rawClass = (Class<?>) resolved;
        if (!Event.class.isAssignableFrom(rawClass)) {
            throw new IllegalArgumentException(rawClass.getName() + " does not extend org.bukkit.event.Event");
        }
        return (Class<? extends Event>) rawClass;
    }

    private EventPriority parsePriority(String priority) {
        if (priority == null) {
            return EventPriority.NORMAL;
        }
        try {
            return EventPriority.valueOf(priority.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unknown event priority '" + priority + "'", exception);
        }
    }

    private String normalizeCommand(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Command name cannot be empty");
        }
        return name.trim().toLowerCase(Locale.ENGLISH);
    }

    private void requireNonNegative(long value, String name) {
        if (value < 0) {
            throw new IllegalArgumentException(name + " cannot be negative");
        }
    }

    private static final class EventBinding {
        private final Class<? extends Event> eventClass;
        private final EventPriority priority;
        private final boolean ignoreCancelled;
        private final Value callback;
        private boolean registered;

        private EventBinding(Class<? extends Event> eventClass, EventPriority priority, boolean ignoreCancelled, Value callback) {
            this.eventClass = eventClass;
            this.priority = priority;
            this.ignoreCancelled = ignoreCancelled;
            this.callback = callback;
        }
    }

    private static final class WebsiteMessageBinding {
        private final String board;
        private final Value callback;

        private WebsiteMessageBinding(String board, Value callback) {
            if (board == null || board.trim().isEmpty()) {
                throw new IllegalArgumentException("Website board name cannot be empty");
            }
            this.board = board.trim();
            this.callback = callback;
        }
    }
}
