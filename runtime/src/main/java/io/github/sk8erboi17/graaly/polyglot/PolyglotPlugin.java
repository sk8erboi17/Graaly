package io.github.sk8erboi17.graaly.polyglot;

import org.bukkit.Server;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.event.HandlerList;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.PluginDescriptionFile;
import org.bukkit.plugin.PluginLoader;
import org.bukkit.plugin.PluginLogger;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Engine;
import org.graalvm.polyglot.EnvironmentAccess;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotAccess;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.io.IOAccess;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;

/**
 * Runtime behind a version-adaptive {@link Plugin} proxy.
 *
 * <p>The Plugin interface changed between 1.8 and modern Spigot (Ebean was
 * removed and biome providers were added). A dynamic proxy implements the
 * exact interface supplied by the running server, so Graaly never links
 * against a constructor or interface shape from one specific release.</p>
 */
public final class PolyglotPlugin implements InvocationHandler {
    private static final Object SOURCE_CACHE_LOCK = new Object();
    private static final Map<PolyglotLanguage, Source> SDK_SOURCES = new HashMap<>();
    private static final Map<String, CachedMainSource> MAIN_SOURCES = new HashMap<>();
    private static Source pythonBundlePathSource;
    private static Source pythonReloadCleanupSource;

    private final PolyglotPluginLoader polyglotLoader;
    private final Server server;
    private final PluginDescriptionFile description;
    private final File dataFolder;
    private final File bundleFile;
    private final PolyglotLanguage language;
    private final Path bundleRoot;
    private final Path mainSource;
    private final String descriptorFingerprint;
    private final ReentrantLock executionLock = new ReentrantLock(true);
    private final Plugin pluginProxy;
    private final PluginLogger logger;

    private Context context;
    private Value entryPoint;
    private GraalyScriptApi scriptApi;
    private PolyglotLogOutputStream standardOutput;
    private PolyglotLogOutputStream errorOutput;
    private Set<String> pristineBindingNames = Set.of();
    private FileConfiguration config;
    private boolean enabled;
    private boolean naggable = true;

    @SuppressWarnings("deprecation")
    PolyglotPlugin(PolyglotPluginLoader loader,
                   Server server,
                   PluginDescriptionFile description,
                   File dataFolder,
                   File bundle,
                   PolyglotLanguage language,
                   Path mainSource,
                   String descriptorFingerprint) throws IOException {
        this.polyglotLoader = loader;
        this.server = server;
        this.description = description;
        this.dataFolder = dataFolder;
        this.bundleFile = bundle;
        this.language = language;
        this.bundleRoot = bundle.toPath().toRealPath();
        this.mainSource = mainSource.toRealPath();
        this.descriptorFingerprint = descriptorFingerprint;
        this.pluginProxy = (Plugin) Proxy.newProxyInstance(
                getHostClassLoader(), new Class<?>[]{Plugin.class}, this);
        this.logger = new PluginLogger(pluginProxy);
    }

    Plugin asPlugin() {
        return pluginProxy;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] arguments) throws Throwable {
        Object[] args = arguments == null ? new Object[0] : arguments;
        String name = method.getName();
        if (method.getDeclaringClass() == Object.class) {
            if ("equals".equals(name)) {
                return args.length == 1 && proxy == args[0];
            }
            if ("hashCode".equals(name)) {
                return System.identityHashCode(proxy);
            }
            if ("toString".equals(name)) {
                return description.getFullName() + " [Graaly " + language.getId() + "]";
            }
        }
        switch (name) {
            case "getDataFolder": return getDataFolder();
            case "getDescription": return getDescription();
            case "getConfig": return getConfig();
            case "getResource": return getResource((String) args[0]);
            case "saveConfig": saveConfig(); return null;
            case "saveDefaultConfig": saveDefaultConfig(); return null;
            case "saveResource": saveResource((String) args[0], (Boolean) args[1]); return null;
            case "reloadConfig": reloadConfig(); return null;
            case "getPluginLoader": return polyglotLoader;
            case "getServer": return server;
            case "isEnabled": return enabled;
            case "onDisable": onDisable(); return null;
            case "onLoad": onLoad(); return null;
            case "onEnable": onEnable(); return null;
            case "isNaggable": return naggable;
            case "setNaggable": naggable = (Boolean) args[0]; return null;
            case "getDatabase": return null;
            case "getDefaultWorldGenerator": return null;
            case "getDefaultBiomeProvider": return null;
            case "getLogger": return logger;
            case "getName": return description.getName();
            case "onCommand":
                return onCommand((CommandSender) args[0], (Command) args[1],
                        (String) args[2], (String[]) args[3]);
            case "onTabComplete":
                return onTabComplete((CommandSender) args[0], (Command) args[1],
                        (String) args[2], (String[]) args[3]);
            default:
                if (method.isDefault()) {
                    return InvocationHandler.invokeDefault(proxy, method, args);
                }
                return defaultValue(method.getReturnType());
        }
    }

    private static Object defaultValue(Class<?> type) {
        if (!type.isPrimitive() || type == void.class) return null;
        if (type == boolean.class) return false;
        if (type == char.class) return '\0';
        if (type == byte.class) return (byte) 0;
        if (type == short.class) return (short) 0;
        if (type == int.class) return 0;
        if (type == long.class) return 0L;
        if (type == float.class) return 0.0F;
        if (type == double.class) return 0.0D;
        return null;
    }

    void initializeRuntime(Engine engine) throws IOException {
        executionLock.lock();
        try {
            if (context != null) {
                return;
            }
            installDefaultBundleConfig();
            if (!engine.getLanguages().containsKey(language.getId())) {
                throw new IllegalStateException("Graal language '" + language.getId() + "' is not available");
            }

            standardOutput = new PolyglotLogOutputStream(getLogger(), Level.INFO);
            errorOutput = new PolyglotLogOutputStream(getLogger(), Level.SEVERE);

            Context.Builder builder = Context.newBuilder(language.getId())
                    .engine(engine)
                    .hostClassLoader(getHostClassLoader())
                    .allowHostAccess(HostAccess.ALL)
                    // Plugin authors use the generated JS/TS/Python API. Direct
                    // Java.type()/host-class lookup would bypass that native
                    // surface and is intentionally unavailable.
                    .allowHostClassLookup(className -> false)
                    .allowHostClassLoading(false)
                    .allowIO(IOAccess.ALL)
                    .allowNativeAccess(false)
                    .allowCreateProcess(false)
                    .allowCreateThread(false)
                    .allowEnvironmentAccess(EnvironmentAccess.NONE)
                    .allowPolyglotAccess(PolyglotAccess.NONE)
                    .currentWorkingDirectory(bundleRoot)
                    .out(standardOutput)
                    .err(errorOutput);

            if (language == PolyglotLanguage.JAVASCRIPT) {
                builder.option("js.ecmascript-version", "2025")
                        .option("js.esm-eval-returns-exports", "true")
                        .option("js.unhandled-rejections", "throw");
            }

            Context created = null;
            try {
                created = builder.build();
                context = created;
                scriptApi = new GraalyScriptApi(this);

                Value bindings = context.getBindings(language.getId());
                pristineBindingNames = new HashSet<>(bindings.getMemberKeys());
                installLanguageBootstrap(bindings);

                entryPoint = context.eval(cachedMainSource());
            } catch (Throwable throwable) {
                if (scriptApi != null) {
                    scriptApi.clear();
                }
                if (created != null) {
                    try {
                        created.close();
                    } catch (Throwable ignored) {
                    }
                }
                context = null;
                entryPoint = null;
                scriptApi = null;
                closeOutputs();
                if (throwable instanceof IOException) {
                    throw (IOException) throwable;
                }
                if (throwable instanceof RuntimeException) {
                    throw (RuntimeException) throwable;
                }
                throw new IllegalStateException("Could not initialize " + getName(), throwable);
            }
        } finally {
            executionLock.unlock();
        }
    }

    /** Copy an editable bundle's default config on first run, like a packaged plugin resource. */
    private void installDefaultBundleConfig() throws IOException {
        Path source = bundleRoot.resolve("config.yml");
        Path target = getDataFolder().toPath().resolve("config.yml");
        if (!Files.isRegularFile(source) || Files.exists(target)) {
            return;
        }
        Files.createDirectories(target.getParent());
        Files.copy(source, target);
    }

    private void installLanguageSdk() throws IOException {
        context.eval(cachedSdkSource(language));
    }

    private void installLanguageBootstrap(Value bindings) throws IOException {
        bindings.putMember("__graaly_bridge__", scriptApi);
        bindings.putMember("__graaly_plugin__", pluginProxy);
        bindings.putMember("__graaly_server__", getServer());
        bindings.putMember("__graaly_logger__", getLogger());
        bindings.putMember("__graaly_data_folder__", getDataFolder());

        if (language == PolyglotLanguage.PYTHON) {
            bindings.putMember("__graaly_bundle_path__", bundleRoot.toString());
            context.eval(pythonBundlePathSource());
        }

        installLanguageSdk();
        removeBootstrapBindings(bindings);
    }

    /**
     * Keep one immutable bootstrap Source strongly reachable so Graal can
     * reuse its parsed code across isolated Contexts in the shared Engine.
     */
    private static Source cachedSdkSource(PolyglotLanguage language) throws IOException {
        synchronized (SOURCE_CACHE_LOCK) {
            Source cached = SDK_SOURCES.get(language);
            if (cached != null) {
                return cached;
            }
            String extension = language == PolyglotLanguage.JAVASCRIPT ? "js" : "py";
            String resourceName = "/polyglot/bootstrap." + extension;
            try (InputStream input = PolyglotPlugin.class.getResourceAsStream(resourceName)) {
                if (input == null) {
                    throw new IOException("Missing embedded language SDK " + resourceName);
                }
                String sourceText = new String(input.readAllBytes(), StandardCharsets.UTF_8);
                cached = Source.newBuilder(language.getId(), sourceText, "graaly-sdk." + extension)
                        .cached(true)
                        .build();
                SDK_SOURCES.put(language, cached);
                return cached;
            }
        }
    }

    private static Source pythonBundlePathSource() throws IOException {
        synchronized (SOURCE_CACHE_LOCK) {
            if (pythonBundlePathSource == null) {
                pythonBundlePathSource = Source.newBuilder("python", "import sys\n"
                                + "if __graaly_bundle_path__ not in sys.path:\n"
                                + "    sys.path.insert(0, __graaly_bundle_path__)\n",
                                "graaly-bundle-path.py")
                        .cached(true)
                        .build();
            }
            return pythonBundlePathSource;
        }
    }

    private static Source pythonReloadCleanupSource() throws IOException {
        synchronized (SOURCE_CACHE_LOCK) {
            if (pythonReloadCleanupSource == null) {
                pythonReloadCleanupSource = Source.newBuilder("python",
                                "def __graaly_reload_cleanup(__graaly_bundle):\n"
                                        + "    import os, sys\n"
                                        + "    root = os.path.realpath(__graaly_bundle)\n"
                                        + "    remove = []\n"
                                        + "    for name, module in list(sys.modules.items()):\n"
                                        + "        module_file = getattr(module, '__file__', None)\n"
                                        + "        if (name == 'graaly' or name.startswith('graaly.') or "
                                        + "(module_file and (os.path.realpath(module_file) == root or "
                                        + "os.path.realpath(module_file).startswith(root + os.sep)))):\n"
                                        + "            remove.append(name)\n"
                                        + "    for name in remove:\n"
                                        + "        sys.modules.pop(name, None)\n"
                                        + "__graaly_reload_cleanup(__graaly_bundle_path__)\n",
                                "graaly-reload-cleanup.py")
                        .cached(true)
                        .build();
            }
            return pythonReloadCleanupSource;
        }
    }

    /**
     * Reuse the exact Source while a plugin file is unchanged. If a developer
     * edits it, its SHA-256 fingerprint replaces the one bounded cache entry
     * for that path and the next reload parses the new program.
     */
    private Source cachedMainSource() throws IOException {
        byte[] sourceBytes = Files.readAllBytes(mainSource);
        String fingerprint;
        try {
            fingerprint = HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(sourceBytes));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }

        String cacheKey = language.getId() + ':' + mainSource;
        synchronized (SOURCE_CACHE_LOCK) {
            CachedMainSource cached = MAIN_SOURCES.get(cacheKey);
            if (cached != null && cached.fingerprint.equals(fingerprint)) {
                return cached.source;
            }

            Source.Builder builder = Source.newBuilder(
                            language.getId(),
                            new String(sourceBytes, StandardCharsets.UTF_8),
                            mainSource.getFileName().toString())
                    .uri(mainSource.toUri())
                    .cached(true);
            if (language == PolyglotLanguage.JAVASCRIPT
                    && mainSource.getFileName().toString().toLowerCase(Locale.ENGLISH).endsWith(".mjs")) {
                builder.mimeType("application/javascript+module");
            }
            Source source = builder.build();
            MAIN_SOURCES.put(cacheKey, new CachedMainSource(fingerprint, source));
            return source;
        }
    }

    private static final class CachedMainSource {
        private final String fingerprint;
        private final Source source;

        private CachedMainSource(String fingerprint, Source source) {
            this.fingerprint = fingerprint;
            this.source = source;
        }
    }

    static void clearMutableSourceCachesForTesting() {
        synchronized (SOURCE_CACHE_LOCK) {
            MAIN_SOURCES.clear();
        }
    }

    /** Remove host objects after the language-native facade captured them. */
    private void removeBootstrapBindings(Value bindings) {
        bindings.removeMember("__graaly_bridge__");
        bindings.removeMember("__graaly_plugin__");
        bindings.removeMember("__graaly_server__");
        bindings.removeMember("__graaly_logger__");
        bindings.removeMember("__graaly_data_folder__");
        bindings.removeMember("__graaly_bundle_path__");
    }

    boolean canResumePythonRuntime(Path requestedMainSource, String requestedDescriptorFingerprint) {
        return language == PolyglotLanguage.PYTHON
                && !isEnabled()
                && context != null
                && mainSource.equals(requestedMainSource.toAbsolutePath().normalize())
                && descriptorFingerprint.equals(requestedDescriptorFingerprint);
    }

    /**
     * Rebuild the Python facade and plugin module inside the same interpreter
     * Context. This preserves isolation between plugin bundles while avoiding
     * a complete GraalPy standard-library initialization on every /reload.
     */
    void reloadPythonProgram() throws IOException {
        executionLock.lock();
        try {
            if (language != PolyglotLanguage.PYTHON || context == null || scriptApi == null) {
                throw new IllegalStateException("Python runtime for " + getName() + " is not resumable");
            }

            scriptApi.clear();
            entryPoint = null;
            Value bindings = context.getBindings(language.getId());
            bindings.putMember("__graaly_bundle_path__", bundleRoot.toString());
            context.eval(pythonReloadCleanupSource());
            for (String name : new HashSet<>(bindings.getMemberKeys())) {
                if (!pristineBindingNames.contains(name)) {
                    bindings.removeMember(name);
                }
            }

            installLanguageBootstrap(bindings);
            entryPoint = context.eval(cachedMainSource());
        } finally {
            executionLock.unlock();
        }
    }

    void suspendRuntime() {
        executionLock.lock();
        try {
            if (scriptApi != null) {
                scriptApi.clear();
            }
            entryPoint = null;
        } finally {
            executionLock.unlock();
        }
    }

    void ensureRuntime() {
        executionLock.lock();
        try {
            if (context != null) {
                return;
            }
        } finally {
            executionLock.unlock();
        }
        try {
            initializeRuntime(polyglotLoader.acquireEngine());
        } catch (IOException exception) {
            throw new IllegalStateException("Could not reopen script plugin " + getName(), exception);
        }
    }

    void setPluginEnabled(boolean enabled) {
        if (this.enabled == enabled) {
            return;
        }
        if (enabled) {
            ensureRuntime();
        }
        this.enabled = enabled;
        if (enabled) {
            onEnable();
        } else {
            onDisable();
        }
    }

    /** Reload guest code while preserving the standalone host plugin and its loader. */
    void reloadProgram() {
        executionLock.lock();
        try {
            if (!enabled) {
                return;
            }
            invokeLifecycle("onDisable", "on_disable");
            if (scriptApi != null) {
                scriptApi.clear();
            }
            HandlerList.unregisterAll(pluginProxy);
            server.getScheduler().cancelTasks(pluginProxy);

            if (language == PolyglotLanguage.PYTHON && context != null) {
                reloadPythonProgram();
            } else {
                closeRuntime();
                initializeRuntime(polyglotLoader.acquireEngine());
            }

            invokeLifecycle("onLoad", "on_load");
            scriptApi.activate();
            invokeLifecycle("onEnable", "on_enable");
        } catch (IOException failure) {
            throw new IllegalStateException("Could not reload " + getName(), failure);
        } finally {
            executionLock.unlock();
        }
    }

    public void onLoad() {
        ensureRuntime();
        invokeLifecycle("onLoad", "on_load");
    }

    public void onEnable() {
        scriptApi.activate();
        invokeLifecycle("onEnable", "on_enable");
    }

    public void onDisable() {
        try {
            invokeLifecycle("onDisable", "on_disable");
        } finally {
            if (scriptApi != null) {
                scriptApi.deactivate();
            }
        }
    }

    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        Value callback = scriptApi == null ? null : scriptApi.getCommand(command.getName());
        if (callback == null) {
            callback = findFunction("onCommand", "on_command");
        }
        if (callback == null) {
            return false;
        }
        Value result = invoke(callback, sender, command, label, args);
        if (scriptApi != null && scriptApi.handleAwaitable(result, "command " + command.getName())) {
            return true;
        }
        return asCommandResult(result);
    }

    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        Value callback = scriptApi == null ? null : scriptApi.getTabCompleter(command.getName());
        if (callback == null) {
            callback = findFunction("onTabComplete", "on_tab_complete");
        }
        if (callback == null) {
            return null;
        }
        return asStringList(invoke(callback, sender, command, alias, args));
    }

    Value invoke(Value callback, Object... arguments) {
        executionLock.lock();
        try {
            return executeLocked(callback, arguments);
        } finally {
            executionLock.unlock();
        }
    }

    /**
     * Run a cooperative guest callback only when this plugin context is idle.
     * Python's asyncio pump uses this from the server tick so a legacy
     * run_async callback can never make the primary thread wait for the
     * context lock.
     */
    boolean tryInvoke(Value callback, Object... arguments) {
        if (!executionLock.tryLock()) {
            return false;
        }
        try {
            executeLocked(callback, arguments);
            return true;
        } finally {
            executionLock.unlock();
        }
    }

    private Value executeLocked(Value callback, Object... arguments) {
        if (context == null) {
            throw new IllegalStateException("Script context for " + getName() + " is closed");
        }
        if (callback == null || !callback.canExecute()) {
            throw new IllegalArgumentException("Value is not an executable guest function");
        }
        return callback.execute(arguments);
    }

    Value invokeOptional(String... names) {
        Value function = findFunction(names);
        return function == null ? null : invoke(function);
    }

    Value findFunction(String... names) {
        executionLock.lock();
        try {
            if (context == null) {
                return null;
            }
            Value function = findMember(entryPoint, names);
            if (function != null) {
                return function;
            }
            if (entryPoint != null && entryPoint.hasMember("default")) {
                function = findMember(entryPoint.getMember("default"), names);
                if (function != null) {
                    return function;
                }
            }
            return findMember(context.getBindings(language.getId()), names);
        } finally {
            executionLock.unlock();
        }
    }

    private Value findMember(Value container, String... names) {
        if (container == null || !container.hasMembers()) {
            return null;
        }
        for (String name : names) {
            if (container.hasMember(name)) {
                Value candidate = container.getMember(name);
                if (candidate != null && candidate.canExecute()) {
                    return candidate;
                }
            }
        }
        return null;
    }

    private void invokeLifecycle(String... names) {
        Value function = findFunction(names);
        if (function != null) {
            Value result = invoke(function);
            if (scriptApi != null) {
                scriptApi.handleAwaitable(result, String.join("/", names));
            }
        }
    }

    private boolean asCommandResult(Value result) {
        if (result == null || result.isNull()) {
            return true;
        }
        if (!result.isBoolean()) {
            throw new IllegalStateException("A command callback must return boolean, null, or None");
        }
        return result.asBoolean();
    }

    private List<String> asStringList(Value result) {
        if (result == null || result.isNull()) {
            return null;
        }
        List<String> values = new ArrayList<>();
        if (result.isHostObject()) {
            Object host = result.asHostObject();
            if (host instanceof Iterable) {
                for (Object item : (Iterable<?>) host) {
                    values.add(String.valueOf(item));
                }
                return values;
            }
        }
        if (!result.hasArrayElements()) {
            throw new IllegalStateException("A tab-completion callback must return an array/list or null");
        }
        for (long index = 0; index < result.getArraySize(); index++) {
            Value item = result.getArrayElement(index);
            if (item != null && !item.isNull()) {
                values.add(item.isString() ? item.asString() : item.toString());
            }
        }
        return values;
    }

    void closeRuntime() {
        executionLock.lock();
        try {
            if (scriptApi != null) {
                scriptApi.clear();
            }
            scriptApi = null;
            entryPoint = null;
            if (context != null) {
                try {
                    context.close();
                } catch (Throwable throwable) {
                    getLogger().log(Level.WARNING, "Could not close the Graal context", throwable);
                }
                context = null;
            }
            closeOutputs();
        } finally {
            executionLock.unlock();
        }
    }

    private void closeOutputs() {
        if (standardOutput != null) {
            try {
                standardOutput.close();
            } catch (IOException ignored) {
            }
            standardOutput = null;
        }
        if (errorOutput != null) {
            try {
                errorOutput.close();
            } catch (IOException ignored) {
            }
            errorOutput = null;
        }
    }

    public InputStream getResource(String filename) {
        if (filename == null || filename.isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be null or empty");
        }
        try {
            Path resource = PolyglotPluginLoader.resolveContained(bundleRoot, filename, true);
            return Files.newInputStream(resource);
        } catch (IOException | IllegalArgumentException exception) {
            return null;
        }
    }

    ClassLoader getHostClassLoader() {
        return PolyglotPlugin.class.getClassLoader();
    }

    Server getServer() {
        return server;
    }

    PluginDescriptionFile getDescription() {
        return description;
    }

    File getDataFolder() {
        return dataFolder;
    }

    PluginLogger getLogger() {
        return logger;
    }

    String getName() {
        return description.getName();
    }

    boolean isEnabled() {
        return enabled;
    }

    synchronized FileConfiguration getConfig() {
        if (config == null) {
            reloadConfig();
        }
        return config;
    }

    synchronized void reloadConfig() {
        File configFile = new File(dataFolder, "config.yml");
        YamlConfiguration loaded = YamlConfiguration.loadConfiguration(configFile);
        Path defaults = bundleRoot.resolve("config.yml");
        if (Files.isRegularFile(defaults)) {
            loaded.setDefaults(YamlConfiguration.loadConfiguration(defaults.toFile()));
        }
        config = loaded;
    }

    synchronized void saveConfig() {
        if (config == null) {
            return;
        }
        try {
            Files.createDirectories(dataFolder.toPath());
            config.save(new File(dataFolder, "config.yml"));
        } catch (IOException failure) {
            logger.log(Level.SEVERE, "Could not save config.yml", failure);
        }
    }

    void saveDefaultConfig() {
        File target = new File(dataFolder, "config.yml");
        if (target.exists()) {
            return;
        }
        if (getResource("config.yml") == null) {
            try {
                Files.createDirectories(dataFolder.toPath());
                Files.createFile(target.toPath());
            } catch (IOException failure) {
                logger.log(Level.SEVERE, "Could not create config.yml", failure);
            }
            return;
        }
        saveResource("config.yml", false);
    }

    void saveResource(String resourcePath, boolean replace) {
        if (resourcePath == null || resourcePath.trim().isEmpty()) {
            throw new IllegalArgumentException("Resource path cannot be empty");
        }
        try {
            Path source = PolyglotPluginLoader.resolveContained(bundleRoot, resourcePath, true);
            Path destination = PolyglotPluginLoader.resolveContained(
                    dataFolder.toPath(), resourcePath, false);
            Files.createDirectories(destination.getParent());
            if (replace) {
                Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
            } else if (!Files.exists(destination)) {
                Files.copy(source, destination);
            }
        } catch (IOException failure) {
            throw new IllegalArgumentException("Could not save resource " + resourcePath, failure);
        }
    }

    Path getBundleRoot() {
        return bundleRoot;
    }

    Path getMainSource() {
        return mainSource;
    }

    String getLanguageId() {
        return language.getId();
    }
}
