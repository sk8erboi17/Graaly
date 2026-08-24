package io.github.sk8erboi17.graaly.polyglot;

import org.bukkit.plugin.Plugin;
import org.graalvm.polyglot.Value;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Modifier;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Optional, reflection-based bridge to the separately installed PacketEvents plugin.
 * Keeping PacketEvents outside the server JAR follows its recommended deployment model
 * and lets administrators update it independently from Graaly.
 */
public final class PacketEventsScriptApi {
    private static final String PLUGIN_NAME = "packetevents";
    private static final String API_CLASS = "com.github.retrooper.packetevents.PacketEvents";
    private static final String LISTENER_CLASS = "com.github.retrooper.packetevents.event.PacketListener";
    private static final String PRIORITY_CLASS = "com.github.retrooper.packetevents.event.PacketListenerPriority";
    private static final String PACKET_TYPE_CLASS = "com.github.retrooper.packetevents.protocol.packettype.PacketType";

    private final PolyglotPlugin plugin;
    private final List<PacketBinding> bindings = new ArrayList<>();

    private Plugin packetEventsPlugin;
    private ClassLoader packetEventsClassLoader;
    private Object packetEventsApi;
    private boolean active;

    PacketEventsScriptApi(PolyglotPlugin plugin) {
        this.plugin = plugin;
    }

    public synchronized boolean isAvailable() {
        try {
            return resolveApi(false) != null;
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    public boolean is_available() {
        return isAvailable();
    }

    public synchronized String getVersion() {
        Object api = requireApi();
        try {
            Object version = invokeBest(api, "getVersion");
            return String.valueOf(version);
        } catch (RuntimeException ignored) {
            return packetEventsPlugin.getDescription().getVersion();
        }
    }

    public String get_version() {
        return getVersion();
    }

    private synchronized Class<?> loadCatalogClass(String className) {
        requireApi();
        try {
            // Looking up an SDK symbol must not trigger PacketEvents class
            // initializers. Several value types consult the live server
            // version from static initializers and are only safe once used.
            return Class.forName(className, false, packetEventsClassLoader);
        } catch (ClassNotFoundException exception) {
            throw new IllegalArgumentException("Cataloged PacketEvents class is unavailable: " + className, exception);
        }
    }

    /** Resolve a wrapper by its exported simple name, with no package path to memorize. */
    public synchronized Class<?> wrapperType(String exportedName) {
        if (exportedName == null || exportedName.trim().isEmpty()) {
            throw new IllegalArgumentException("PacketEvents wrapper symbol cannot be empty");
        }
        String normalized = exportedName.trim();
        String className = PolyglotTypeCatalog.packetWrapperClass(normalized);
        if (className == null) {
            throw new IllegalArgumentException("Unknown PacketEvents wrapper symbol: " + exportedName);
        }
        return loadCatalogClass(className);
    }

    public Class<?> wrapper_type(String exportedName) {
        return wrapperType(exportedName);
    }

    /** Resolve a generated PacketEvents/Adventure supporting type by its SDK name. */
    public synchronized Class<?> namedType(String exportedName) {
        if (exportedName == null || exportedName.trim().isEmpty()) {
            throw new IllegalArgumentException("PacketEvents type symbol cannot be empty");
        }
        String normalized = exportedName.trim();
        String className = PolyglotTypeCatalog.packetSupportClass(normalized);
        if (className == null) {
            throw new IllegalArgumentException("Unknown PacketEvents SDK type: " + exportedName);
        }
        return loadCatalogClass(className);
    }

    public Class<?> named_type(String exportedName) {
        return namedType(exportedName);
    }

    public String[] getWrapperTypeNames() {
        return PolyglotTypeCatalog.packetWrapperNames();
    }

    public String[] get_wrapper_type_names() {
        return getWrapperTypeNames();
    }

    public String[] getTypeNames() {
        return PolyglotTypeCatalog.packetSupportNames();
    }

    public String[] get_type_names() {
        return getTypeNames();
    }

    public String[] getPacketTypePaths() {
        return PolyglotTypeCatalog.packetTypePaths();
    }

    public String[] get_packet_type_paths() {
        return getPacketTypePaths();
    }

    /** Resolve paths such as {@code Play.Client.CHAT_MESSAGE}. */
    public synchronized Object packetType(Object pathOrType) {
        Object raw = unwrap(pathOrType);
        if (!(raw instanceof String)) {
            if (raw == null) {
                throw new IllegalArgumentException("Packet type cannot be null");
            }
            return raw;
        }
        String path = ((String) raw).trim();
        if (path.isEmpty()) {
            throw new IllegalArgumentException("Packet type path cannot be empty");
        }
        boolean known = false;
        for (String catalogPath : PolyglotTypeCatalog.packetTypePaths()) {
            if (catalogPath.equals(path)) {
                known = true;
                break;
            }
        }
        if (!known) {
            throw new IllegalArgumentException("Unknown PacketEvents packet type path: " + path);
        }
        requireApi();
        try {
            Class<?> current = Class.forName(PACKET_TYPE_CLASS, true, packetEventsClassLoader);
            String[] parts = path.replace('/', '.').split("\\.");
            for (int index = 0; index < parts.length; index++) {
                String part = parts[index];
                Class<?> nested = nestedClass(current, part);
                if (nested != null) {
                    current = nested;
                    continue;
                }
                if (index != parts.length - 1) {
                    throw new IllegalArgumentException("Unknown PacketEvents packet type path: " + path);
                }
                Field field = current.getField(enumName(part));
                if (!Modifier.isStatic(field.getModifiers())) {
                    throw new IllegalArgumentException("Packet type field is not static: " + path);
                }
                return field.get(null);
            }
            throw new IllegalArgumentException("Packet type path must end in a packet constant: " + path);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalArgumentException("Unknown PacketEvents packet type: " + path, exception);
        }
    }

    public Object packet_type(Object pathOrType) {
        return packetType(pathOrType);
    }

    /** Construct any PacketEvents wrapper while coercing guest numeric values to Java primitives. */
    public Object create(Object wrapperType, Object... arguments) {
        Class<?> type = resolveClass(wrapperType);
        return HostInterop.construct(type, arguments);
    }

    public Object createPacked(Object wrapperType, Object arguments) {
        return create(wrapperType, HostInterop.packedArguments(arguments));
    }

    public Object create_packed(Object wrapperType, Object arguments) {
        return createPacked(wrapperType, arguments);
    }

    public Object wrap(Object wrapperType, Object packetEvent) {
        return create(wrapperType, unwrap(packetEvent));
    }

    public Object onReceive(Value callback) {
        return onReceive(null, "NORMAL", callback);
    }

    public Object onReceive(Object packetType, Value callback) {
        return onReceive(packetType, "NORMAL", callback);
    }

    public synchronized Object onReceive(Object packetType, String priority, Value callback) {
        return bind("onPacketReceive", packetType, priority, callback);
    }

    public Object on_receive(Object packetType, String priority, Value callback) {
        return onReceive(packetType, priority, callback);
    }

    public Object onSend(Value callback) {
        return onSend(null, "NORMAL", callback);
    }

    public Object onSend(Object packetType, Value callback) {
        return onSend(packetType, "NORMAL", callback);
    }

    public synchronized Object onSend(Object packetType, String priority, Value callback) {
        return bind("onPacketSend", packetType, priority, callback);
    }

    public Object on_send(Object packetType, String priority, Value callback) {
        return onSend(packetType, priority, callback);
    }

    public void send(Object player, Object packet) {
        playerOperation("sendPacket", player, packet);
    }

    public void sendSilently(Object player, Object packet) {
        playerOperation("sendPacketSilently", player, packet);
    }

    public void send_silently(Object player, Object packet) {
        sendSilently(player, packet);
    }

    public void receive(Object player, Object packet) {
        playerOperation("receivePacket", player, packet);
    }

    public void receiveSilently(Object player, Object packet) {
        playerOperation("receivePacketSilently", player, packet);
    }

    public void receive_silently(Object player, Object packet) {
        receiveSilently(player, packet);
    }

    public Object user(Object player) {
        return invokeBest(playerManager(), "getUser", unwrap(player));
    }

    public Object clientVersion(Object player) {
        return invokeBest(playerManager(), "getClientVersion", unwrap(player));
    }

    public Object client_version(Object player) {
        return clientVersion(player);
    }

    public int ping(Object player) {
        Object value = invokeBest(playerManager(), "getPing", unwrap(player));
        return ((Number) value).intValue();
    }

    synchronized void activate() {
        active = true;
        for (PacketBinding binding : bindings) {
            register(binding);
        }
    }

    synchronized void deactivate() {
        active = false;
        for (PacketBinding binding : bindings) {
            unregister(binding);
        }
    }

    synchronized void clear() {
        active = false;
        for (PacketBinding binding : bindings) {
            unregister(binding);
        }
        bindings.clear();
        packetEventsApi = null;
        packetEventsClassLoader = null;
        packetEventsPlugin = null;
    }

    private Object bind(String methodName, Object requestedType, String priority, Value callback) {
        Object filter = requestedType == null ? null : packetType(requestedType);
        Value executable = requireExecutable(callback);
        PacketBinding binding = new PacketBinding(methodName, filter, parsePriority(priority), executable);
        bindings.add(binding);
        // Guest modules are evaluated during plugin load, before Bukkit enables
        // the plugin. Keep the declaration, but do not expose a live network
        // listener until the matching enable lifecycle boundary is reached.
        if (active) {
            register(binding);
        }
        return binding.listener;
    }

    private void register(final PacketBinding binding) {
        if (binding.registration != null) {
            return;
        }
        Object api = requireApi();
        try {
            Class<?> listenerType = Class.forName(LISTENER_CLASS, true, packetEventsClassLoader);
            InvocationHandler handler = (proxy, method, args) -> {
                if (method.getDeclaringClass() == Object.class) {
                    switch (method.getName()) {
                        case "toString":
                            return "GraalyPacketListener[" + plugin.getName() + "]";
                        case "hashCode":
                            return System.identityHashCode(proxy);
                        case "equals":
                            return proxy == (args == null ? null : args[0]);
                        default:
                            return null;
                    }
                }
                if (method.getName().equals(binding.methodName) && args != null && args.length == 1) {
                    Object event = args[0];
                    if (isActive() && matches(binding.packetType, event)) {
                        plugin.invoke(binding.callback, event);
                    }
                    return null;
                }
                if (method.isDefault()) {
                    return InvocationHandler.invokeDefault(proxy, method, args == null ? new Object[0] : args);
                }
                return primitiveDefault(method.getReturnType());
            };
            binding.listener = Proxy.newProxyInstance(packetEventsClassLoader, new Class<?>[]{listenerType}, handler);
            Object manager = invokeBest(api, "getEventManager");
            binding.manager = manager;
            binding.registration = invokeBest(manager, "registerListener", binding.listener, binding.priority);
        } catch (ClassNotFoundException exception) {
            throw new IllegalStateException("PacketEvents listener API is unavailable", exception);
        }
    }

    private synchronized boolean isActive() {
        return active;
    }

    private boolean matches(Object packetType, Object event) {
        if (packetType == null) {
            return true;
        }
        Object actual = invokeBest(event, "getPacketType");
        return packetType.equals(actual);
    }

    private void unregister(PacketBinding binding) {
        if (binding.registration == null || binding.manager == null) {
            return;
        }
        try {
            invokeBest(binding.manager, "unregisterListener", binding.registration);
        } catch (RuntimeException exception) {
            plugin.getLogger().warning("Could not unregister a PacketEvents listener: " + exception.getMessage());
        } finally {
            binding.registration = null;
            binding.listener = null;
            binding.manager = null;
        }
    }

    private synchronized Object requireApi() {
        Object api = resolveApi(true);
        if (api == null) {
            throw new IllegalStateException("PacketEvents is not installed or has not completed onLoad. "
                    + "Install PacketEvents 2.13.0 and add 'depend: [packetevents]' to plugin.yml.");
        }
        return api;
    }

    private Object resolveApi(boolean failOnBrokenInstallation) {
        Plugin installed = findPacketEventsPlugin();
        if (installed == null) {
            return null;
        }
        if (installed == packetEventsPlugin && packetEventsApi != null) {
            return packetEventsApi;
        }
        try {
            ClassLoader loader = installed.getClass().getClassLoader();
            Class<?> packetEvents = Class.forName(API_CLASS, true, loader);
            Object api = packetEvents.getMethod("getAPI").invoke(null);
            if (api == null) {
                return null;
            }
            packetEventsPlugin = installed;
            packetEventsClassLoader = loader;
            packetEventsApi = api;
            return api;
        } catch (ReflectiveOperationException exception) {
            if (failOnBrokenInstallation) {
                throw new IllegalStateException("The installed PacketEvents plugin does not expose a compatible 2.x API", exception);
            }
            return null;
        }
    }

    private Plugin findPacketEventsPlugin() {
        Plugin direct = plugin.getServer().getPluginManager().getPlugin(PLUGIN_NAME);
        if (direct != null) {
            return direct;
        }
        Plugin[] installed = plugin.getServer().getPluginManager().getPlugins();
        if (installed != null) {
            for (Plugin candidate : installed) {
                if (candidate != null && PLUGIN_NAME.equalsIgnoreCase(candidate.getName())) {
                    return candidate;
                }
            }
        }
        return null;
    }

    private Object parsePriority(String priority) {
        requireApi();
        String name = priority == null ? "NORMAL" : priority.trim().toUpperCase(Locale.ENGLISH);
        try {
            Class<?> type = Class.forName(PRIORITY_CLASS, true, packetEventsClassLoader);
            @SuppressWarnings({"rawtypes", "unchecked"})
            Object value = Enum.valueOf((Class<? extends Enum>) type.asSubclass(Enum.class), name);
            return value;
        } catch (ClassNotFoundException | IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unknown PacketEvents listener priority '" + priority + "'", exception);
        }
    }

    private Object playerManager() {
        return invokeBest(requireApi(), "getPlayerManager");
    }

    private void playerOperation(String operation, Object player, Object packet) {
        invokeBest(playerManager(), operation, unwrap(player), unwrap(packet));
    }

    private Class<?> resolveClass(Object classOrName) {
        Object raw = unwrap(classOrName);
        if (raw instanceof Class<?>) {
            return (Class<?>) raw;
        }
        throw new IllegalArgumentException("Wrapper type must be an imported PacketEvents API symbol");
    }

    private Class<?> nestedClass(Class<?> parent, String requested) {
        String normalized = requested.replace("_", "");
        for (Class<?> nested : parent.getClasses()) {
            if (nested.getSimpleName().replace("_", "").equalsIgnoreCase(normalized)) {
                return nested;
            }
        }
        return null;
    }

    private String enumName(String value) {
        StringBuilder result = new StringBuilder();
        char previous = 0;
        for (char current : value.trim().toCharArray()) {
            if (Character.isLetterOrDigit(current)) {
                if (Character.isUpperCase(current) && Character.isLowerCase(previous) && result.length() > 0) {
                    result.append('_');
                }
                result.append(Character.toUpperCase(current));
            } else if (result.length() > 0 && result.charAt(result.length() - 1) != '_') {
                result.append('_');
            }
            previous = current;
        }
        return result.toString();
    }

    private Value requireExecutable(Value callback) {
        if (callback == null || !callback.canExecute()) {
            throw new IllegalArgumentException("Packet callback must be a function");
        }
        callback.pin();
        return callback;
    }

    private Object unwrap(Object value) {
        return HostInterop.unwrap(value);
    }

    private Object invokeBest(Object target, String name, Object... arguments) {
        return HostInterop.invoke(target, name, arguments);
    }

    private Object primitiveDefault(Class<?> type) {
        if (!type.isPrimitive() || type == void.class) return null;
        if (type == boolean.class) return false;
        if (type == char.class) return '\0';
        if (type == byte.class) return (byte) 0;
        if (type == short.class) return (short) 0;
        if (type == int.class) return 0;
        if (type == long.class) return 0L;
        if (type == float.class) return 0F;
        if (type == double.class) return 0D;
        return null;
    }

    private static final class PacketBinding {
        private final String methodName;
        private final Object packetType;
        private final Object priority;
        private final Value callback;
        private Object listener;
        private Object manager;
        private Object registration;

        private PacketBinding(String methodName, Object packetType, Object priority, Value callback) {
            this.methodName = methodName;
            this.packetType = packetType;
            this.priority = priority;
            this.callback = callback;
        }
    }
}
