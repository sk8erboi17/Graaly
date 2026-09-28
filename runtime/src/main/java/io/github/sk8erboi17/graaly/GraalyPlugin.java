package io.github.sk8erboi17.graaly;

import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.InvalidDescriptionException;
import org.bukkit.plugin.InvalidPluginException;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.PluginDescriptionFile;
import org.bukkit.plugin.PluginLoader;
import org.bukkit.plugin.UnknownDependencyException;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;

/** Bootstraps the standalone Graaly script loader without any server patch. */
public final class GraalyPlugin extends JavaPlugin {
    private final List<Plugin> loadedScripts = new ArrayList<>();
    private PluginLoader loader;
    private Class<? extends PluginLoader> loaderClass;
    private GraalRuntimeInstaller.InstalledRuntime graalRuntime;

    @Override
    public void onLoad() {
        requireSupportedJava();
        // Spigot's PluginClassLoader reads plugin JAR entries itself instead of
        // delegating multi-release selection to URLClassLoader. The shaded JAR
        // retains every META-INF/versions entry and its manifest flag, but
        // Truffle's packaging self-check therefore sees the base entry. This
        // documented switch disables only that self-check; it does not widen
        // guest permissions or change Graaly's sandbox configuration.
        System.setProperty("polyglotimpl.DisableMultiReleaseCheck", "true");
        try {
            graalRuntime = GraalRuntimeInstaller.install(this);
            try (GraalRuntimeInstaller.Scope ignored = graalRuntime.activate()) {
                loaderClass = graalRuntime.loadRuntimeClass(
                        "io.github.sk8erboi17.graaly.polyglot.PolyglotPluginLoader")
                        .asSubclass(PluginLoader.class);
                invokeStatic("configureRuntime", new Class<?>[]{org.bukkit.Server.class,
                        GraalRuntimeInstaller.InstalledRuntime.class}, getServer(), graalRuntime);
                getServer().getPluginManager().registerInterface(loaderClass);
                loader = (PluginLoader) invokeStatic("forServer",
                        new Class<?>[]{org.bukkit.Server.class}, getServer());
                if (loader == null) {
                    throw new IllegalStateException("Spigot registered Graaly's loader but did not construct it");
                }

                File scripts = new File(getDataFolder(), "scripts");
                if (!scripts.isDirectory() && !scripts.mkdirs() && !scripts.isDirectory()) {
                    throw new IllegalStateException("Could not create " + scripts);
                }

                List<File> bundles = new ArrayList<>();
                collectBundles(scripts, bundles);
                collectBundles(getDataFolder().getParentFile(), bundles);
                loadBundlesInDependencyOrder(bundles);
            }
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            closeRuntimeInstaller();
            throw new IllegalStateException("Interrupted while installing Graal language runtimes", interrupted);
        } catch (LinkageError failure) {
            closeRuntimeInstaller();
            throw new IllegalStateException("Could not link the downloaded Graal language runtimes", failure);
        } catch (Exception failure) {
            closeRuntimeInstaller();
            throw new IllegalStateException("Could not prepare Graal language runtimes", failure);
        }
    }

    @Override
    public void onEnable() {
        if (graalRuntime == null || loader == null) {
            throw new IllegalStateException(
                    "Graaly did not finish loading; inspect the earlier runtime installation error");
        }
        getLogger().info("Graaly is ready: " + loadedScripts.size()
                + " guest plugin(s), downloaded Graal "
                + String.join(" + ", graalRuntime.languages()) + ' '
                + GraalRuntimeInstaller.GRAAL_VERSION + ", Java " + Runtime.version().feature());
    }

    @Override
    public void onDisable() {
        try {
            if (loader != null) {
                invokeLoader("shutdown", new Class<?>[0]);
            }
        } finally {
            closeRuntimeInstaller();
            loadedScripts.clear();
        }
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!command.getName().equalsIgnoreCase("graaly")) {
            return false;
        }
        if (args.length == 0 || args[0].equalsIgnoreCase("status")) {
            sender.sendMessage("Graaly: " + loadedPluginCount()
                    + " guest plugin(s), "
                    + (graalRuntime == null ? "no language runtime" : String.join(" + ", graalRuntime.languages()))
                    + ", Java " + Runtime.version().feature());
            return true;
        }
        if (args[0].equalsIgnoreCase("reload")) {
            if (!sender.hasPermission("graaly.admin")) {
                sender.sendMessage("You do not have permission.");
                return true;
            }
            try {
                if (loader == null) {
                    sender.sendMessage("Graaly is not ready; inspect the server log.");
                    return true;
                }
                int count = (Integer) invokeLoader("reloadAll", new Class<?>[0]);
                sender.sendMessage("Reloaded " + count + " Graaly guest plugin(s).");
            } catch (Throwable failure) {
                sender.sendMessage("Graaly reload failed: " + failure.getMessage());
                getLogger().log(Level.SEVERE, "Could not reload Graaly plugins", failure);
            }
            return true;
        }
        return false;
    }

    private void loadBundlesInDependencyOrder(List<File> candidates) {
        Map<String, Bundle> pending = new LinkedHashMap<>();
        for (File candidate : candidates) {
            try {
                PluginDescriptionFile description = loader.getPluginDescription(candidate);
                String key = description.getName().toLowerCase(Locale.ENGLISH);
                Bundle previous = pending.putIfAbsent(key, new Bundle(candidate, description));
                if (previous != null) {
                    getLogger().warning("Ignoring duplicate Graaly plugin " + candidate
                            + "; already found " + previous.file);
                }
            } catch (InvalidDescriptionException failure) {
                getLogger().log(Level.SEVERE, "Invalid Graaly bundle " + candidate, failure);
            }
        }

        Set<String> loadedNames = new LinkedHashSet<>();
        for (Plugin plugin : getServer().getPluginManager().getPlugins()) {
            loadedNames.add(plugin.getName().toLowerCase(Locale.ENGLISH));
        }

        boolean progressed;
        do {
            progressed = false;
            for (Bundle bundle : new ArrayList<>(pending.values())) {
                if (!dependenciesPresent(bundle.description, loadedNames)) {
                    continue;
                }
                try {
                    Plugin plugin = getServer().getPluginManager().loadPlugin(bundle.file);
                    if (plugin == null) {
                        throw new InvalidPluginException("No loader accepted " + bundle.file);
                    }
                    loadedScripts.add(plugin);
                    loadedNames.add(plugin.getName().toLowerCase(Locale.ENGLISH));
                    pending.remove(bundle.description.getName().toLowerCase(Locale.ENGLISH));
                    plugin.getLogger().info("Loading " + plugin.getDescription().getFullName());
                    plugin.onLoad();
                } catch (InvalidPluginException | InvalidDescriptionException
                         | UnknownDependencyException failure) {
                    pending.remove(bundle.description.getName().toLowerCase(Locale.ENGLISH));
                    getLogger().log(Level.SEVERE, "Could not load Graaly bundle " + bundle.file, failure);
                } catch (Throwable failure) {
                    pending.remove(bundle.description.getName().toLowerCase(Locale.ENGLISH));
                    getLogger().log(Level.SEVERE, "Could not initialize Graaly bundle " + bundle.file, failure);
                    logCauseChain(failure);
                }
                progressed = true;
            }
        } while (progressed && !pending.isEmpty());

        for (Bundle unresolved : pending.values()) {
            getLogger().severe("Could not load " + unresolved.description.getFullName()
                    + ": missing dependency from " + unresolved.description.getDepend());
        }
    }

    private boolean dependenciesPresent(PluginDescriptionFile description, Set<String> loadedNames) {
        for (String dependency : description.getDepend()) {
            if (!loadedNames.contains(dependency.toLowerCase(Locale.ENGLISH))) {
                return false;
            }
        }
        return true;
    }

    private static void collectBundles(File directory, List<File> target) {
        File[] children = directory == null ? null : directory.listFiles(file -> file.isDirectory()
                && (file.getName().toLowerCase(Locale.ENGLISH).endsWith(".jsplugin")
                || file.getName().toLowerCase(Locale.ENGLISH).endsWith(".pyplugin")
                || file.getName().toLowerCase(Locale.ENGLISH).endsWith(".cplugin")));
        if (children == null) {
            return;
        }
        Arrays.sort(children, Comparator.comparing(File::getName, String.CASE_INSENSITIVE_ORDER));
        target.addAll(Arrays.asList(children));
    }

    private void logCauseChain(Throwable failure) {
        Set<Throwable> seen = java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>());
        Throwable cursor = failure;
        while (cursor != null && seen.add(cursor)) {
            getLogger().severe("Runtime cause: " + cursor.getClass().getName()
                    + (cursor.getMessage() == null ? "" : ": " + cursor.getMessage()));
            cursor = cursor.getCause();
        }
    }

    private static void requireSupportedJava() {
        if (Runtime.version().feature() < 17) {
            throw new IllegalStateException("Graaly requires Java 17 or newer; found " + Runtime.version());
        }
    }

    private void closeRuntimeInstaller() {
        clearConfiguredRuntime();
        if (graalRuntime == null) {
            return;
        }
        try {
            graalRuntime.close();
        } catch (Exception failure) {
            getLogger().log(Level.WARNING, "Could not close the Graal runtime class loader", failure);
        } finally {
            graalRuntime = null;
            loader = null;
            loaderClass = null;
        }
    }

    private Object invokeStatic(String name, Class<?>[] parameterTypes, Object... arguments) {
        try {
            Method method = loaderClass.getMethod(name, parameterTypes);
            return method.invoke(null, arguments);
        } catch (InvocationTargetException wrapped) {
            throw propagate(wrapped.getCause());
        } catch (ReflectiveOperationException failure) {
            throw new IllegalStateException("Cannot call Graaly runtime method " + name, failure);
        }
    }

    private Object invokeLoader(String name, Class<?>[] parameterTypes, Object... arguments) {
        if (loader == null || loaderClass == null) {
            return null;
        }
        try {
            Method method = loaderClass.getMethod(name, parameterTypes);
            return method.invoke(loader, arguments);
        } catch (InvocationTargetException wrapped) {
            throw propagate(wrapped.getCause());
        } catch (ReflectiveOperationException failure) {
            throw new IllegalStateException("Cannot call Graaly runtime method " + name, failure);
        }
    }

    private int loadedPluginCount() {
        Object value = invokeLoader("loadedPluginCount", new Class<?>[0]);
        return value instanceof Integer count ? count : 0;
    }

    private void clearConfiguredRuntime() {
        if (loaderClass == null) {
            return;
        }
        try {
            invokeStatic("clearRuntime", new Class<?>[]{org.bukkit.Server.class}, getServer());
        } catch (RuntimeException failure) {
            getLogger().log(Level.WARNING, "Could not clear Graaly runtime registration", failure);
        }
    }

    private static RuntimeException propagate(Throwable failure) {
        if (failure instanceof RuntimeException runtime) {
            return runtime;
        }
        if (failure instanceof Error error) {
            throw error;
        }
        return new IllegalStateException(failure);
    }

    private static final class Bundle {
        private final File file;
        private final PluginDescriptionFile description;

        private Bundle(File file, PluginDescriptionFile description) {
            this.file = file;
            this.description = description;
        }
    }
}
