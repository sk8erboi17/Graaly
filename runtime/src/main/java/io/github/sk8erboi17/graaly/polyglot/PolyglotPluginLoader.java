package io.github.sk8erboi17.graaly.polyglot;

import io.github.sk8erboi17.graaly.GraalRuntimeInstaller;
import org.apache.commons.lang.Validate;
import org.bukkit.Server;
import org.bukkit.Warning;
import org.bukkit.event.Event;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.server.PluginDisableEvent;
import org.bukkit.event.server.PluginEnableEvent;
import org.bukkit.plugin.AuthorNagException;
import org.bukkit.plugin.EventExecutor;
import org.bukkit.plugin.InvalidDescriptionException;
import org.bukkit.plugin.InvalidPluginException;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.PluginDescriptionFile;
import org.bukkit.plugin.PluginLoader;
import org.bukkit.plugin.RegisteredListener;
import org.bukkit.plugin.UnknownDependencyException;
import org.graalvm.polyglot.Engine;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.WeakHashMap;
import java.util.logging.Level;
import java.util.regex.Pattern;

/** Loads editable {@code .jsplugin}, {@code .pyplugin}, and compiled {@code .cplugin} directories. */
public final class PolyglotPluginLoader implements PluginLoader {
    private static final Pattern[] FILE_FILTERS = {
            Pattern.compile("(?i)\\.jsplugin$"),
            Pattern.compile("(?i)\\.pyplugin$"),
            Pattern.compile("(?i)\\.cplugin$")
    };
    private static final Map<Server, PolyglotPluginLoader> LOADERS = new WeakHashMap<>();
    private static final Map<Server, GraalRuntimeInstaller.InstalledRuntime> RUNTIMES = new WeakHashMap<>();

    private final Server server;
    private final GraalRuntimeInstaller.InstalledRuntime runtime;
    private final Map<String, PolyglotPlugin> plugins = new LinkedHashMap<>();
    private final Map<Plugin, PolyglotPlugin> runtimes = new IdentityHashMap<>();
    private Engine engine;

    /**
     * Graal language implementations keep expensive runtime metadata in the
     * {@link Engine}.  A server reload replaces PluginLoader instances, so an
     * engine owned by one loader makes GraalPy materialize another complete
     * language runtime on every reload. Contexts remain isolated per plugin;
     * JavaScript contexts close on disable, while a Python context is suspended
     * and its guest state is rebuilt when the same bundle is loaded again. The
     * engine is intentionally shared for the lifetime of this server class loader.
     */
    public PolyglotPluginLoader(Server server) {
        Validate.notNull(server, "Server cannot be null");
        requireSupportedJava();
        this.server = server;
        synchronized (LOADERS) {
            runtime = RUNTIMES.get(server);
            if (runtime == null) {
                throw new IllegalStateException("Graaly language runtime was not installed before loader registration");
            }
            LOADERS.put(server, this);
        }
    }

    public static void configureRuntime(Server server, GraalRuntimeInstaller.InstalledRuntime runtime) {
        Validate.notNull(server, "Server cannot be null");
        Validate.notNull(runtime, "Runtime cannot be null");
        synchronized (LOADERS) {
            RUNTIMES.put(server, runtime);
        }
    }

    public static void clearRuntime(Server server) {
        synchronized (LOADERS) {
            RUNTIMES.remove(server);
        }
    }

    public static PolyglotPluginLoader forServer(Server server) {
        synchronized (LOADERS) {
            return LOADERS.get(server);
        }
    }

    @Override
    public Plugin loadPlugin(File bundle) throws InvalidPluginException, UnknownDependencyException {
        Validate.notNull(bundle, "Bundle cannot be null");
        if (!bundle.exists()) {
            throw new InvalidPluginException(new FileNotFoundException(bundle + " does not exist"));
        }
        if (!bundle.isDirectory()) {
            throw new InvalidPluginException("Polyglot plugin bundles must be directories: " + bundle);
        }

        PolyglotLanguage language = PolyglotLanguage.fromBundle(bundle);
        if (language == null) {
            throw new InvalidPluginException("Unknown polyglot plugin bundle type: " + bundle.getName());
        }
        if (!runtime.languages().contains(language.getId())) {
            throw new InvalidPluginException("Graal language '" + language.getId()
                    + "' is disabled in plugins/Graaly/config.yml");
        }

        PluginDescriptionFile description;
        try {
            description = getPluginDescription(bundle);
        } catch (InvalidDescriptionException exception) {
            throw new InvalidPluginException(exception);
        }

        if (!language.acceptsMain(description.getMain())) {
            throw new InvalidPluginException("Main source '" + description.getMain() + "' is not valid for " + language.getId());
        }

        final Path bundleRoot;
        final Path mainSource;
        final String descriptorFingerprint;
        try {
            bundleRoot = bundle.toPath().toRealPath();
            mainSource = resolveContained(bundleRoot, description.getMain(), true).toRealPath();
            descriptorFingerprint = fingerprint(resolveContained(bundleRoot, "plugin.yml", true));
        } catch (IOException | IllegalArgumentException exception) {
            throw new InvalidPluginException("Cannot read main source '" + description.getMain() + "'", exception);
        }

        File dataFolder = prepareDataFolder(bundle, description);
        for (String dependency : description.getDepend()) {
            if (server.getPluginManager().getPlugin(dependency) == null) {
                throw new UnknownDependencyException(dependency);
            }
        }

        try {
            PolyglotPlugin plugin = new PolyglotPlugin(
                    this, server, description, dataFolder, bundle, language, mainSource, descriptorFingerprint);
            synchronized (this) {
                plugins.put(description.getName(), plugin);
                runtimes.put(plugin.asPlugin(), plugin);
            }
            return plugin.asPlugin();
        } catch (Throwable throwable) {
            if (throwable instanceof InvalidPluginException) {
                throw (InvalidPluginException) throwable;
            }
            throw new InvalidPluginException("Could not create " + description.getFullName(), throwable);
        }
    }

    @Override
    public PluginDescriptionFile getPluginDescription(File bundle) throws InvalidDescriptionException {
        Validate.notNull(bundle, "Bundle cannot be null");
        if (!bundle.isDirectory()) {
            throw new InvalidDescriptionException("Polyglot plugin bundle is not a directory: " + bundle);
        }
        try {
            Path root = bundle.toPath().toRealPath();
            Path descriptor = resolveContained(root, "plugin.yml", true);
            try (InputStream stream = Files.newInputStream(descriptor)) {
                return new PluginDescriptionFile(stream);
            }
        } catch (InvalidDescriptionException exception) {
            throw exception;
        } catch (IOException | IllegalArgumentException exception) {
            throw new InvalidDescriptionException(exception, "Could not read plugin.yml from " + bundle);
        }
    }

    @Override
    public Pattern[] getPluginFileFilters() {
        return FILE_FILTERS.clone();
    }

    @Override
    public Map<Class<? extends Event>, Set<RegisteredListener>> createRegisteredListeners(Listener listener, final Plugin plugin) {
        Validate.notNull(plugin, "Plugin can not be null");
        Validate.notNull(listener, "Listener can not be null");

        Map<Class<? extends Event>, Set<RegisteredListener>> result = new LinkedHashMap<>();
        Set<Method> methods;
        try {
            Method[] publicMethods = listener.getClass().getMethods();
            Method[] privateMethods = listener.getClass().getDeclaredMethods();
            methods = new HashSet<>(publicMethods.length + privateMethods.length, 1.0f);
            methods.addAll(Arrays.asList(publicMethods));
            methods.addAll(Arrays.asList(privateMethods));
        } catch (NoClassDefFoundError error) {
            plugin.getLogger().severe("Could not inspect listener " + listener.getClass() + ": " + error.getMessage());
            return result;
        }

        for (Method method : methods) {
            EventHandler annotation = method.getAnnotation(EventHandler.class);
            if (annotation == null || method.isBridge() || method.isSynthetic()) {
                continue;
            }
            Class<?>[] parameters = method.getParameterTypes();
            if (parameters.length != 1 || !Event.class.isAssignableFrom(parameters[0])) {
                plugin.getLogger().severe("Invalid @EventHandler signature: " + method.toGenericString());
                continue;
            }
            Class<? extends Event> eventClass = parameters[0].asSubclass(Event.class);
            method.setAccessible(true);
            Set<RegisteredListener> listeners = result.get(eventClass);
            if (listeners == null) {
                listeners = new HashSet<>();
                result.put(eventClass, listeners);
            }

            warnForDeprecatedEvent(plugin, eventClass, method);
            EventExecutor executor = new EventExecutor() {
                @Override
                public void execute(Listener target, Event event) throws org.bukkit.event.EventException {
                    try {
                        method.invoke(target, event);
                    } catch (InvocationTargetException failure) {
                        throw new org.bukkit.event.EventException(failure.getCause());
                    } catch (Throwable failure) {
                        throw new org.bukkit.event.EventException(failure);
                    }
                }
            };
            listeners.add(new RegisteredListener(
                    listener,
                    executor,
                    annotation.priority(),
                    plugin,
                    annotation.ignoreCancelled()
            ));
        }
        return result;
    }

    @Override
    public void enablePlugin(Plugin candidate) {
        PolyglotPlugin plugin = requirePlugin(candidate);
        if (plugin.isEnabled()) {
            return;
        }

        plugin.getLogger().info("Enabling " + plugin.getDescription().getFullName()
                + " [Graal" + displayLanguage(plugin.getLanguageId()) + "]");
        synchronized (this) {
            plugins.put(plugin.getName(), plugin);
        }

        try (GraalRuntimeInstaller.Scope ignored = runtime.activate()) {
            plugin.setPluginEnabled(true);
            server.getPluginManager().callEvent(new PluginEnableEvent(candidate));
        } catch (Throwable throwable) {
            server.getLogger().log(Level.SEVERE, "Error enabling " + plugin.getDescription().getFullName(), throwable);
            if (plugin.isEnabled()) {
                server.getPluginManager().disablePlugin(candidate);
            } else {
                plugin.closeRuntime();
                synchronized (this) {
                    plugins.remove(plugin.getName());
                    runtimes.remove(candidate);
                }
            }
        }
    }

    @Override
    public void disablePlugin(Plugin candidate) {
        PolyglotPlugin plugin = requirePlugin(candidate);
        if (!plugin.isEnabled()) {
            return;
        }

        plugin.getLogger().info("Disabling " + plugin.getDescription().getFullName());
        server.getPluginManager().callEvent(new PluginDisableEvent(candidate));
        try {
            plugin.setPluginEnabled(false);
        } catch (Throwable throwable) {
            server.getLogger().log(Level.SEVERE, "Error disabling " + plugin.getDescription().getFullName(), throwable);
        } finally {
            plugin.closeRuntime();
            synchronized (this) {
                plugins.remove(plugin.getName());
                runtimes.remove(candidate);
            }
        }
    }

    synchronized Engine acquireEngine() {
        if (engine == null) {
            try (GraalRuntimeInstaller.Scope ignored = runtime.activate()) {
                engine = Engine.newBuilder().build();
            }
        }
        return engine;
    }

    public synchronized int loadedPluginCount() {
        return runtimes.size();
    }

    public int reloadAll() {
        ArrayList<PolyglotPlugin> snapshot;
        synchronized (this) {
            snapshot = new ArrayList<>(runtimes.values());
        }
        int reloaded = 0;
        try (GraalRuntimeInstaller.Scope ignored = runtime.activate()) {
            for (PolyglotPlugin plugin : snapshot) {
                if (plugin.isEnabled()) {
                    plugin.reloadProgram();
                    reloaded++;
                }
            }
        }
        return reloaded;
    }

    public void shutdown() {
        ArrayList<PolyglotPlugin> snapshot;
        synchronized (this) {
            snapshot = new ArrayList<>(runtimes.values());
            plugins.clear();
            runtimes.clear();
        }
        for (PolyglotPlugin plugin : snapshot) {
            plugin.closeRuntime();
        }
        synchronized (this) {
            if (engine != null) {
                try {
                    engine.close();
                } catch (Throwable ignored) {
                }
                engine = null;
            }
        }
        synchronized (LOADERS) {
            if (LOADERS.get(server) == this) {
                LOADERS.remove(server);
            }
        }
        PolyglotPlugin.clearMutableSourceCachesForTesting();
    }

    private static String fingerprint(Path path) throws IOException {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(path)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    private File prepareDataFolder(File bundle, PluginDescriptionFile description) throws InvalidPluginException {
        File parent = bundle.getParentFile();
        File dataFolder = new File(parent, description.getName());
        @SuppressWarnings("deprecation") File oldDataFolder = new File(parent, description.getRawName());

        if (!dataFolder.equals(oldDataFolder) && oldDataFolder.isDirectory() && !dataFolder.exists()) {
            if (!oldDataFolder.renameTo(dataFolder)) {
                throw new InvalidPluginException("Unable to rename old data folder " + oldDataFolder + " to " + dataFolder);
            }
        }
        if (dataFolder.exists() && !dataFolder.isDirectory()) {
            throw new InvalidPluginException("Projected data folder is not a directory: " + dataFolder);
        }
        return dataFolder;
    }

    private PolyglotPlugin requirePlugin(Plugin plugin) {
        PolyglotPlugin runtime;
        synchronized (this) {
            runtime = runtimes.get(plugin);
        }
        Validate.isTrue(runtime != null && plugin.getPluginLoader() == this,
                "Plugin is not associated with this PolyglotPluginLoader");
        return runtime;
    }

    private void warnForDeprecatedEvent(Plugin plugin, Class<? extends Event> eventClass, Method method) {
        for (Class<?> type = eventClass; Event.class.isAssignableFrom(type); type = type.getSuperclass()) {
            if (type.getAnnotation(Deprecated.class) == null) {
                continue;
            }
            Warning warning = type.getAnnotation(Warning.class);
            Warning.WarningState state = server.getWarningState();
            if (state.printFor(warning)) {
                plugin.getLogger().log(Level.WARNING,
                        "Listener " + method.toGenericString() + " uses deprecated event " + type.getName(),
                        state == Warning.WarningState.ON ? new AuthorNagException(null) : null);
            }
            break;
        }
    }

    static Path resolveContained(Path root, String relative, boolean mustExist) throws IOException {
        if (relative == null || relative.trim().isEmpty()) {
            throw new IllegalArgumentException("Path cannot be empty");
        }
        Path normalizedRoot = root.toAbsolutePath().normalize();
        Path candidate = normalizedRoot.resolve(relative.replace('\\', '/')).normalize();
        if (!candidate.startsWith(normalizedRoot)) {
            throw new IllegalArgumentException("Path escapes the plugin bundle: " + relative);
        }
        if (mustExist) {
            Path real = candidate.toRealPath();
            if (!real.startsWith(normalizedRoot.toRealPath()) || !Files.isRegularFile(real)) {
                throw new IllegalArgumentException("Path is not a regular file inside the plugin bundle: " + relative);
            }
            return real;
        }
        return candidate;
    }

    private static void requireSupportedJava() {
        int feature = Runtime.version().feature();
        if (feature < 17) {
            throw new IllegalStateException("Graaly JS/Python/C plugins require Java 17 or newer (found "
                    + Runtime.version() + ")");
        }
    }

    private String displayLanguage(String id) {
        if ("js".equals(id)) return "JS";
        if ("python".equals(id)) return "Py";
        if ("wasm".equals(id)) return "C/Wasm";
        return id;
    }
}
