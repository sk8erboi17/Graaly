package io.github.sk8erboi17.graaly.polyglot;

import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.event.Event;
import org.bukkit.event.EventException;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.scheduler.BukkitTask;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Engine;
import org.graalvm.polyglot.EnvironmentAccess;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.io.ByteSequence;
import org.graalvm.polyglot.io.IOAccess;
import org.graalvm.polyglot.proxy.ProxyExecutable;
import org.graalvm.polyglot.proxy.ProxyObject;

import java.io.IOException;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Level;

/**
 * WebAssembly-backed C guest runtime.
 *
 * <p>The C SDK deliberately exposes primitive handles and field readers instead
 * of Java-shaped Player/World objects. Plugin authors construct their own C
 * structs and decide which data to copy into them. That keeps the language
 * educational: structs, arrays, pointers, sizeof, ownership, and lifetime are
 * normal C concepts rather than hidden behind a generated object facade.</p>
 */
final class GraalyCPluginRuntime implements AutoCloseable {
    static final int ABI_VERSION = 1;

    static final int EVENT_PLAYER_JOIN = 1;
    static final int EVENT_PLAYER_QUIT = 2;

    private static final int MAX_HOST_STRING = 64 * 1024;
    private static final int MAX_BRIDGE_STRING = 4 * 1024 * 1024;
    private static final int MAX_BRIDGE_ARGUMENTS = 256;
    private static final int C_VALUE_SIZE = 24;
    private static final int TEXT_CALLBACK_FLAG = 0x40000000;
    private static final int PACKET_CALLBACK_FLAG = 0x20000000;
    private static final int MAX_COMMAND_PAYLOAD = 1024 * 1024;
    private static final int MAX_TAB_COMPLETE_BYTES = 64 * 1024;

    private final PolyglotPlugin owner;
    private final Path mainSource;
    private final Listener eventListener = new Listener() { };
    private final Map<Integer, List<Integer>> eventCallbacks = new LinkedHashMap<>();
    private final Map<Long, Object> handles = new LinkedHashMap<>();
    private final AtomicLong nextHandle = new AtomicLong(1L);

    private Context context;
    private Value instance;
    private Value exports;
    private Value memory;
    private GraalyScriptApi bridgeApi;
    private String lastError = "";
    private boolean faulted;

    GraalyCPluginRuntime(PolyglotPlugin owner, Path mainSource) {
        this.owner = owner;
        this.mainSource = mainSource;
    }

    void initialize(Engine engine) throws IOException {
        if (context != null) {
            return;
        }
        byte[] wasm = Files.readAllBytes(mainSource);

        Context created = Context.newBuilder("wasm")
                .engine(engine)
                .allowHostAccess(HostAccess.ALL)
                .allowHostClassLookup(name -> false)
                .allowHostClassLoading(false)
                .allowNativeAccess(false)
                .allowCreateProcess(false)
                .allowCreateThread(false)
                .allowEnvironmentAccess(EnvironmentAccess.NONE)
                .allowPolyglotAccess(PolyglotAccess.NONE)
                .allowIO(IOAccess.NONE)
                .option("wasm.Builtins", "wasi_snapshot_preview1")
                .build();

        try {
            context = created;
            String moduleName = owner.getName().replaceAll("[^A-Za-z0-9_.-]", "_");
            Source source = Source.newBuilder(
                            "wasm",
                            ByteSequence.create(wasm),
                            moduleName)
                    .uri(mainSource.toUri())
                    .cached(true)
                    .build();

            bridgeApi = new GraalyScriptApi(owner);
            Value module = context.eval(source);
            ProxyObject importObject = ProxyObject.fromMap(Map.of(
                    "graaly", ProxyObject.fromMap(hostFunctions())));
            instance = module.newInstance(importObject);
            exports = requireMember(instance, "exports", "WebAssembly instance exports");
            memory = requireMember(exports, "memory",
                    "C plugins must export linear memory (link with --export-memory)");
            if (!memory.hasBufferElements() || !memory.isBufferWritable()) {
                throw new IllegalStateException("C plugin memory export is not a writable WebAssembly memory");
            }

            executeOptional("_initialize");
            Value abi = requireExecutable("graaly_abi_version");
            int actualAbi = abi.execute().asInt();
            if (actualAbi != ABI_VERSION) {
                throw new IllegalStateException("C plugin ABI " + actualAbi
                        + " is incompatible with Graaly C ABI " + ABI_VERSION);
            }
        } catch (Throwable failure) {
            try {
                created.close(true);
            } catch (Throwable ignored) {
            }
            context = null;
            instance = null;
            exports = null;
            memory = null;
            if (failure instanceof IOException) {
                throw (IOException) failure;
            }
            if (failure instanceof RuntimeException) {
                throw (RuntimeException) failure;
            }
            throw new IllegalStateException("Could not initialize C/Wasm plugin " + owner.getName(), failure);
        }
    }

    void onLoad() {
        executeOptional("graaly_plugin_load");
    }

    void onEnable() {
        if (bridgeApi != null) {
            bridgeApi.activate();
        }
        executeOptional("graaly_plugin_enable");
    }

    void onDisable() {
        if (bridgeApi != null) {
            bridgeApi.deactivate();
        }
        if (faulted) {
            owner.getLogger().warning(
                    "Skipping C guest onDisable because the WebAssembly instance is faulted; "
                            + "the host will discard it safely.");
            return;
        }
        executeOptional("graaly_plugin_disable");
    }

    boolean onCommand(CommandSender sender, Command command, String[] args) {
        if (faulted) {
            sender.sendMessage(ChatColor.RED
                    + "This C plugin is quarantined after a WebAssembly trap. "
                    + "Use /graaly reload after fixing or reviewing the C code.");
            return true;
        }
        Value dispatcher = optionalExecutable("graaly_dispatch_command");
        if (dispatcher == null) {
            return false;
        }

        long senderHandle = openHandle(sender);
        int block = 0;
        try {
            byte[] commandName = command.getName().getBytes(StandardCharsets.UTF_8);
            byte[][] encodedArgs = new byte[args.length][];
            long payload = (long) args.length * 8L + commandName.length;
            for (int index = 0; index < args.length; index++) {
                encodedArgs[index] = args[index].getBytes(StandardCharsets.UTF_8);
                payload += encodedArgs[index].length;
            }
            if (payload > MAX_COMMAND_PAYLOAD) {
                throw new IllegalArgumentException("Command payload exceeds " + MAX_COMMAND_PAYLOAD + " bytes");
            }

            block = guestAlloc((int) Math.max(payload, 1L));
            long base = Integer.toUnsignedLong(block);
            long cursor = base + (long) args.length * 8L;

            int commandPointer = checkedPointer(cursor);
            writeBytes(commandPointer, commandName);
            cursor += commandName.length;

            for (int index = 0; index < encodedArgs.length; index++) {
                byte[] argument = encodedArgs[index];
                int pointer = checkedPointer(cursor);
                writeBytes(pointer, argument);
                memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, base + (long) index * 8L, pointer);
                memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, base + (long) index * 8L + 4L, argument.length);
                cursor += argument.length;
            }

            Value result = execute(dispatcher,
                    senderHandle,
                    commandPointer,
                    commandName.length,
                    args.length,
                    block);
            return result == null || result.isNull() || result.asInt() != 0;
        } finally {
            if (block != 0) {
                guestFree(block);
            }
            closeHandle(senderHandle);
        }
    }

    List<String> onTabComplete(CommandSender sender, Command command, String[] args) {
        if (faulted) {
            return null;
        }
        Value dispatcher = optionalExecutable("graaly_dispatch_tab_complete");
        if (dispatcher == null) {
            return null;
        }

        long senderHandle = openHandle(sender);
        int payloadBlock = 0;
        int outputBlock = 0;
        try {
            byte[] commandName = command.getName().getBytes(StandardCharsets.UTF_8);
            byte[][] encodedArgs = new byte[args.length][];
            long payload = (long) args.length * 8L + commandName.length;
            for (int index = 0; index < args.length; index++) {
                encodedArgs[index] = args[index].getBytes(StandardCharsets.UTF_8);
                payload += encodedArgs[index].length;
            }
            if (payload > MAX_COMMAND_PAYLOAD) {
                throw new IllegalArgumentException("Tab completion payload exceeds " + MAX_COMMAND_PAYLOAD + " bytes");
            }

            payloadBlock = guestAlloc((int) Math.max(payload, 1L));
            long base = Integer.toUnsignedLong(payloadBlock);
            long cursor = base + (long) args.length * 8L;
            int commandPointer = checkedPointer(cursor);
            writeBytes(commandPointer, commandName);
            cursor += commandName.length;

            for (int index = 0; index < encodedArgs.length; index++) {
                byte[] argument = encodedArgs[index];
                int pointer = checkedPointer(cursor);
                writeBytes(pointer, argument);
                memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, base + (long) index * 8L, pointer);
                memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, base + (long) index * 8L + 4L, argument.length);
                cursor += argument.length;
            }

            int required = execute(
                    dispatcher,
                    senderHandle,
                    commandPointer,
                    commandName.length,
                    args.length,
                    payloadBlock,
                    0,
                    0).asInt();
            if (required <= 0) {
                return new ArrayList<>();
            }
            if (required > MAX_TAB_COMPLETE_BYTES) {
                throw new IllegalArgumentException("Tab completion output exceeds " + MAX_TAB_COMPLETE_BYTES + " bytes");
            }

            outputBlock = guestAlloc(required + 1);
            int written = execute(
                    dispatcher,
                    senderHandle,
                    commandPointer,
                    commandName.length,
                    args.length,
                    payloadBlock,
                    outputBlock,
                    required + 1).asInt();
            int selected = Math.min(required, Math.max(0, written));
            String payloadText = readUtf8(outputBlock, selected, MAX_TAB_COMPLETE_BYTES);
            List<String> values = new ArrayList<>();
            for (String line : payloadText.split("\n", -1)) {
                if (!line.isEmpty()) {
                    values.add(line);
                }
            }
            return values;
        } finally {
            if (outputBlock != 0) {
                guestFree(outputBlock);
            }
            if (payloadBlock != 0) {
                guestFree(payloadBlock);
            }
            closeHandle(senderHandle);
        }
    }

    void invokeLifecycle(String javaStyleName) {
        switch (javaStyleName) {
            case "onLoad":
                onLoad();
                break;
            case "onEnable":
                onEnable();
                break;
            case "onDisable":
                onDisable();
                break;
            default:
                throw new IllegalArgumentException("Unknown C lifecycle " + javaStyleName);
        }
    }

    private Map<String, Object> hostFunctions() {
        Map<String, Object> functions = new LinkedHashMap<>();

        functions.put("log", (ProxyExecutable) args -> {
            int level = args[0].asInt();
            String message = readUtf8(args[1].asInt(), args[2].asInt(), MAX_HOST_STRING);
            Level javaLevel = level >= 2 ? Level.SEVERE : level == 1 ? Level.WARNING : Level.INFO;
            owner.getLogger().log(javaLevel, message);
            return 0;
        });

        functions.put("sender_send_message", (ProxyExecutable) args -> {
            CommandSender sender = requireHandle(args[0].asLong(), CommandSender.class);
            String message = readUtf8(args[1].asInt(), args[2].asInt(), MAX_HOST_STRING);
            sender.sendMessage(ChatColor.translateAlternateColorCodes('&', message));
            return 0;
        });

        functions.put("sender_as_player", (ProxyExecutable) args -> {
            long handle = args[0].asLong();
            Object target = requireHandle(handle, Object.class);
            return target instanceof Player ? handle : 0L;
        });

        functions.put("player_name", (ProxyExecutable) args -> {
            Player player = requireHandle(args[0].asLong(), Player.class);
            return writeCString(player.getName(), args[1].asInt(), args[2].asInt());
        });

        functions.put("player_uuid", (ProxyExecutable) args -> {
            Player player = requireHandle(args[0].asLong(), Player.class);
            return writeCString(player.getUniqueId().toString(), args[1].asInt(), args[2].asInt());
        });

        functions.put("player_health", (ProxyExecutable) args ->
                requireHandle(args[0].asLong(), Player.class).getHealth());

        functions.put("player_level", (ProxyExecutable) args ->
                requireHandle(args[0].asLong(), Player.class).getLevel());

        functions.put("listen", (ProxyExecutable) args -> {
            registerEventCallback(args[0].asInt(), args[1].asInt());
            return 0;
        });

        functions.put("bridge", (ProxyExecutable) args -> bridge(
                args[0].asInt(),
                args[1].asLong(),
                args[2].asLong(),
                args[3].asLong(),
                args[4].asLong(),
                args[5].asLong()));

        return functions;
    }

    private int bridge(int operation, long a, long b, long c, long d, long e) {
        try {
            if (operation != 28) {
                lastError = "";
            }
            switch (operation) {
                case 1: { // type
                    String name = readUtf8((int) a, (int) b, MAX_HOST_STRING);
                    writeGuestValue((int) c, requireBridgeApi().namedApiType(name));
                    return 0;
                }
                case 2: { // constant
                    String namespace = readUtf8((int) a, (int) b, MAX_HOST_STRING);
                    String name = readUtf8((int) c, (int) d, MAX_HOST_STRING);
                    writeGuestValue((int) e, requireBridgeApi().namedConstant(namespace, name));
                    return 0;
                }
                case 3: { // roots
                    Object root;
                    switch ((int) a) {
                        case 1: root = owner.asPlugin(); break;
                        case 2: root = owner.getServer(); break;
                        case 3: root = owner.getConfig(); break;
                        case 4: root = owner.getLogger(); break;
                        case 5: root = owner.getDataFolder(); break;
                        default: throw new IllegalArgumentException("Unknown Graaly C root " + a);
                    }
                    writeGuestValue((int) b, root);
                    return 0;
                }
                case 4: { // property get
                    Object target = requireHandle(a, Object.class);
                    String member = readUtf8((int) b, (int) c, MAX_HOST_STRING);
                    GraalyScriptApi api = requireBridgeApi();
                    Object result;
                    if (api.hasProperty(target, member)) {
                        result = api.property(target, member);
                    } else if (api.hasCanonicalInstanceMember(target, member)) {
                        result = api.unavailableInstanceMember(target, member);
                    } else {
                        throw new IllegalArgumentException("Unknown readable canonical member '" + member + "'");
                    }
                    writeGuestValue((int) d, result);
                    return 0;
                }
                case 5: { // property set
                    Object target = requireHandle(a, Object.class);
                    String member = readUtf8((int) b, (int) c, MAX_HOST_STRING);
                    Object value = readGuestValue((int) d);
                    GraalyScriptApi api = requireBridgeApi();
                    if (api.hasWritableProperty(target, member)) {
                        api.setProperty(target, member, value);
                    } else if (api.hasCanonicalWritableMember(target, member)) {
                        api.unavailableInstanceMember(target, member);
                    } else {
                        throw new IllegalArgumentException("Unknown writable canonical member '" + member + "'");
                    }
                    return 0;
                }
                case 6: { // invoke
                    Object target = requireHandle(a, Object.class);
                    String member = readUtf8((int) b, (int) c, MAX_HOST_STRING);
                    int argv = (int) d;
                    int resultPointer = (int) e;
                    int argc = (int) (e >>> 32);
                    Object[] arguments = readGuestValues(argv, argc);
                    GraalyScriptApi api = requireBridgeApi();
                    if (api.isPropertyAccessorCall(target, member, argc)) {
                        throw new IllegalArgumentException(
                                "Java-style accessor " + member + "() is not exposed; use graaly_get/graaly_set");
                    }
                    Object result;
                    if (api.hasMethod(target, member)) {
                        result = api.invoke(target, member, arguments);
                    } else if (target instanceof Class<?> && api.hasCanonicalStaticMember(target, member)) {
                        result = api.unavailableStaticMember(target, member);
                    } else if (api.hasCanonicalInstanceMember(target, member)) {
                        result = api.unavailableInstanceMember(target, member);
                    } else {
                        throw new IllegalArgumentException("Unknown canonical method '" + member + "'");
                    }
                    writeGuestValue(resultPointer, result);
                    return 0;
                }
                case 7: { // construct
                    Object type = requireHandle(a, Object.class);
                    Object[] arguments = readGuestValues((int) b, checkedArgumentCount(c));
                    writeGuestValue((int) d, requireBridgeApi().construct(type, arguments));
                    return 0;
                }
                case 8: { // static member
                    Object type = requireHandle(a, Object.class);
                    String member = readUtf8((int) b, (int) c, MAX_HOST_STRING);
                    GraalyScriptApi api = requireBridgeApi();
                    Object result;
                    if (api.hasStaticMember(type, member)) {
                        result = api.staticMember(type, member);
                    } else if (api.hasCanonicalStaticMember(type, member)) {
                        result = api.unavailableStaticMember(type, member);
                    } else {
                        throw new IllegalArgumentException("Unknown canonical static member '" + member + "'");
                    }
                    writeGuestValue((int) d, result);
                    return 0;
                }
                case 9:
                    return requireBridgeApi().collectionSize(requireHandle(a, Object.class));
                case 10:
                    writeGuestValue((int) c, requireBridgeApi().collectionGet(
                            requireHandle(a, Object.class), checkedIndex(b)));
                    return 0;
                case 11:
                    requireBridgeApi().collectionSet(
                            requireHandle(a, Object.class), checkedIndex(b), readGuestValue((int) c));
                    return 0;
                case 12:
                    return requireBridgeApi().collectionAdd(
                            requireHandle(a, Object.class), readGuestValue((int) b)) ? 1 : 0;
                case 13:
                    writeGuestValue((int) c, requireBridgeApi().collectionRemoveAt(
                            requireHandle(a, Object.class), checkedIndex(b)));
                    return 0;
                case 14:
                    return requireBridgeApi().collectionContains(
                            requireHandle(a, Object.class), readGuestValue((int) b)) ? 1 : 0;
                case 15:
                    requireBridgeApi().collectionClear(requireHandle(a, Object.class));
                    return 0;
                case 16:
                    return requireBridgeApi().mapSize(requireHandle(a, Object.class));
                case 17:
                    writeGuestValue((int) c, requireBridgeApi().mapGet(
                            requireHandle(a, Object.class), readGuestValue((int) b)));
                    return 0;
                case 18:
                    writeGuestValue((int) d, requireBridgeApi().mapPut(
                            requireHandle(a, Object.class),
                            readGuestValue((int) b),
                            readGuestValue((int) c)));
                    return 0;
                case 19:
                    writeGuestValue((int) c, requireBridgeApi().mapRemove(
                            requireHandle(a, Object.class), readGuestValue((int) b)));
                    return 0;
                case 20:
                    return requireBridgeApi().mapContainsKey(
                            requireHandle(a, Object.class), readGuestValue((int) b)) ? 1 : 0;
                case 21:
                    requireBridgeApi().mapClear(requireHandle(a, Object.class));
                    return 0;
                case 22:
                    writeGuestValue((int) b,
                            requireBridgeApi().optionalValue(requireHandle(a, Object.class)));
                    return 0;
                case 23:
                    closeHandle(a);
                    return 0;
                case 24:
                    return requireBridgeApi().supports(readUtf8((int) a, (int) b, MAX_HOST_STRING)) ? 1 : 0;
                case 25:
                    requireBridgeApi().requireFeature(readUtf8((int) a, (int) b, MAX_HOST_STRING));
                    return 0;
                case 26:
                    return requireBridgeApi().typeAvailable(
                            readUtf8((int) a, (int) b, MAX_HOST_STRING)) ? 1 : 0;
                case 27: {
                    Object target = requireHandle(a, Object.class);
                    return writeCString(String.valueOf(target), (int) b, (int) c);
                }
                case 28:
                    return writeCString(lastError, (int) a, (int) b);
                case 29: {
                    String module = readUtf8((int) a, (int) b, MAX_HOST_STRING);
                    String op = readUtf8((int) c, (int) d, MAX_HOST_STRING);
                    int request = (int) e;
                    long base = requireRange(request, 16);
                    int argv = memory.readBufferInt(ByteOrder.LITTLE_ENDIAN, base);
                    int argc = memory.readBufferInt(ByteOrder.LITTLE_ENDIAN, base + 4L);
                    int result = memory.readBufferInt(ByteOrder.LITTLE_ENDIAN, base + 8L);
                    writeGuestValue(result, moduleCall(module, op, readGuestValues(argv, argc)));
                    return 0;
                }
                case 30: {
                    String eventType = readUtf8((int) a, (int) b, MAX_HOST_STRING);
                    String priority = readUtf8((int) c, (int) d, MAX_HOST_STRING);
                    long request = requireRange((int) e, 8);
                    boolean ignoreCancelled =
                            memory.readBufferInt(ByteOrder.LITTLE_ENDIAN, request) != 0;
                    int callbackId =
                            memory.readBufferInt(ByteOrder.LITTLE_ENDIAN, request + 4L);
                    registerGenericEvent(eventType, priority, ignoreCancelled, callbackId);
                    return 0;
                }
                case 31:
                    return scheduleTask((int) a, b, c, (int) d);
                case 32:
                    owner.getServer().getScheduler().cancelTask((int) a);
                    return 0;
                case 33:
                    return owner.getServer().isPrimaryThread() ? 1 : 0;
                default:
                    throw new IllegalArgumentException("Unknown Graaly C bridge operation " + operation);
            }
        } catch (Throwable failure) {
            lastError = failure.getClass().getSimpleName()
                    + (failure.getMessage() == null ? "" : ": " + failure.getMessage());
            owner.getLogger().log(Level.FINE, "Graaly C bridge call failed: " + lastError, failure);
            return -1;
        }
    }

    private GraalyScriptApi requireBridgeApi() {
        if (bridgeApi == null) {
            throw new IllegalStateException("Graaly C bridge is not initialized");
        }
        return bridgeApi;
    }

    private int checkedArgumentCount(long value) {
        if (value < 0L || value > MAX_BRIDGE_ARGUMENTS) {
            throw new IllegalArgumentException("C bridge argument count exceeds " + MAX_BRIDGE_ARGUMENTS);
        }
        return (int) value;
    }

    private int checkedIndex(long value) {
        if (value < 0L || value > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("C collection index out of range: " + value);
        }
        return (int) value;
    }

    private Object[] readGuestValues(int pointer, int count) {
        int selected = checkedArgumentCount(count);
        if (selected == 0) {
            return new Object[0];
        }
        long base = requireRange(pointer, Math.multiplyExact(selected, C_VALUE_SIZE));
        Object[] result = new Object[selected];
        for (int index = 0; index < selected; index++) {
            result[index] = readGuestValueAt(base + (long) index * C_VALUE_SIZE);
        }
        return result;
    }

    private Object readGuestValue(int pointer) {
        return readGuestValueAt(requireRange(pointer, C_VALUE_SIZE));
    }

    private Object readGuestValueAt(long address) {
        int kind = memory.readBufferInt(ByteOrder.LITTLE_ENDIAN, address);
        long a = memory.readBufferLong(ByteOrder.LITTLE_ENDIAN, address + 8L);
        long b = memory.readBufferLong(ByteOrder.LITTLE_ENDIAN, address + 16L);
        switch (kind) {
            case 0:
                return null;
            case 1:
                return a != 0L;
            case 2:
                return a;
            case 3:
                return Double.longBitsToDouble(a);
            case 4:
                if (a > 0xffff_ffffL || b > Integer.MAX_VALUE) {
                    throw new IllegalArgumentException("Invalid wasm32 string view");
                }
                return readUtf8((int) a, (int) b, MAX_BRIDGE_STRING);
            case 5:
                return requireHandle(a, Object.class);
            default:
                throw new IllegalArgumentException("Unknown Graaly C value kind " + kind);
        }
    }

    private long writeGuestValue(int pointer, Object value) {
        long address = requireRange(pointer, C_VALUE_SIZE);
        memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, address, 0);
        memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, address + 4L, 0);
        memory.writeBufferLong(ByteOrder.LITTLE_ENDIAN, address + 8L, 0L);
        memory.writeBufferLong(ByteOrder.LITTLE_ENDIAN, address + 16L, 0L);

        if (value == null) {
            return 0L;
        }
        if (value instanceof Boolean) {
            memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, address, 1);
            memory.writeBufferLong(ByteOrder.LITTLE_ENDIAN, address + 8L,
                    ((Boolean) value) ? 1L : 0L);
            return 0L;
        }
        if (value instanceof Byte || value instanceof Short
                || value instanceof Integer || value instanceof Long) {
            memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, address, 2);
            memory.writeBufferLong(ByteOrder.LITTLE_ENDIAN, address + 8L,
                    ((Number) value).longValue());
            return 0L;
        }
        if (value instanceof Float || value instanceof Double) {
            memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, address, 3);
            memory.writeBufferLong(ByteOrder.LITTLE_ENDIAN, address + 8L,
                    Double.doubleToRawLongBits(((Number) value).doubleValue()));
            return 0L;
        }

        long handle = openHandle(value);
        memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, address, 5);
        memory.writeBufferLong(ByteOrder.LITTLE_ENDIAN, address + 8L, handle);
        return handle;
    }

    private Value callbackValue(int callbackId) {
        if (callbackId <= 0) {
            throw new IllegalArgumentException("C callback id must be positive");
        }
        if ((callbackId & PACKET_CALLBACK_FLAG) != 0) {
            return packetCallbackValue(callbackId & ~PACKET_CALLBACK_FLAG);
        }
        if ((callbackId & TEXT_CALLBACK_FLAG) != 0) {
            return textCallbackValue(callbackId & ~TEXT_CALLBACK_FLAG);
        }
        return context.asValue((ProxyExecutable) rawArguments -> {
            Object[] arguments = new Object[rawArguments.length];
            for (int index = 0; index < rawArguments.length; index++) {
                arguments[index] = HostInterop.unwrap(rawArguments[index]);
            }
            return invokeCCallback(callbackId, arguments);
        });
    }

    private Value packetCallbackValue(int callbackId) {
        if (callbackId <= 0) {
            throw new IllegalArgumentException("C packet callback id must be positive");
        }
        return context.asValue((ProxyExecutable) rawArguments -> {
            if (rawArguments.length == 0) {
                throw new IllegalArgumentException("Packet callback did not receive an event");
            }
            Object event = HostInterop.unwrap(rawArguments[0]);
            long handle = openHandle(event);
            try {
                execute(
                        requireExecutable("graaly_dispatch_packet_callback"),
                        callbackId,
                        handle);
                return null;
            } finally {
                closeHandle(handle);
            }
        });
    }

    private Value textCallbackValue(int callbackId) {
        if (callbackId <= 0) {
            throw new IllegalArgumentException("C text callback id must be positive");
        }
        return context.asValue((ProxyExecutable) rawArguments -> {
            Object raw = rawArguments.length == 0 ? "" : HostInterop.unwrap(rawArguments[0]);
            byte[] encoded = String.valueOf(raw == null ? "" : raw)
                    .getBytes(StandardCharsets.UTF_8);
            if (encoded.length > MAX_BRIDGE_STRING) {
                throw new IllegalArgumentException(
                        "C text callback payload exceeds " + MAX_BRIDGE_STRING + " bytes");
            }

            int block = guestAlloc(Math.max(1, encoded.length));
            try {
                if (encoded.length > 0) {
                    writeBytes(block, encoded);
                }
                execute(
                        requireExecutable("graaly_dispatch_text_callback"),
                        callbackId,
                        block,
                        encoded.length);
                return null;
            } finally {
                guestFree(block);
            }
        });
    }

    private Object invokeCCallback(int callbackId, Object... arguments) {
        if (arguments.length > MAX_BRIDGE_ARGUMENTS) {
            throw new IllegalArgumentException("C callback argument count exceeds " + MAX_BRIDGE_ARGUMENTS);
        }

        int bytes = Math.max(1, Math.multiplyExact(arguments.length + 1, C_VALUE_SIZE));
        int block = guestAlloc(bytes);
        int resultPointer = block + arguments.length * C_VALUE_SIZE;
        List<Long> temporaryHandles = new ArrayList<>();
        try {
            for (int index = 0; index < arguments.length; index++) {
                long handle = writeGuestValue(
                        block + index * C_VALUE_SIZE,
                        arguments[index]);
                if (handle != 0L) {
                    temporaryHandles.add(handle);
                }
            }
            writeGuestValue(resultPointer, null);
            execute(requireExecutable("graaly_dispatch_callback"),
                    callbackId,
                    block,
                    arguments.length,
                    resultPointer);
            return readGuestValue(resultPointer);
        } finally {
            for (long handle : temporaryHandles) {
                closeHandle(handle);
            }
            guestFree(block);
        }
    }

    private void registerGenericEvent(
            String exportedName,
            String priorityName,
            boolean ignoreCancelled,
            int callbackId) {
        Object raw = requireBridgeApi().namedApiType(exportedName);
        if (!(raw instanceof Class<?>)
                || !Event.class.isAssignableFrom((Class<?>) raw)) {
            throw new IllegalArgumentException(exportedName + " is not a Bukkit event type");
        }
        @SuppressWarnings("unchecked")
        Class<? extends Event> eventClass = (Class<? extends Event>) raw;
        EventPriority priority;
        try {
            priority = EventPriority.valueOf(
                    (priorityName == null || priorityName.isEmpty() ? "NORMAL" : priorityName)
                            .toUpperCase(java.util.Locale.ENGLISH));
        } catch (IllegalArgumentException failure) {
            throw new IllegalArgumentException("Unknown event priority " + priorityName, failure);
        }

        owner.getServer().getPluginManager().registerEvent(
                eventClass,
                eventListener,
                priority,
                (ignored, event) -> dispatchObjectEvent(callbackId, event),
                owner.asPlugin(),
                ignoreCancelled);
    }

    private void dispatchObjectEvent(int callbackId, Event event) {
        if (faulted) {
            return;
        }
        Value dispatcher = requireExecutable("graaly_dispatch_object_event");
        long eventHandle = openHandle(event);
        try {
            execute(dispatcher, callbackId, eventHandle);
        } finally {
            closeHandle(eventHandle);
        }
    }

    private int scheduleTask(int kind, long delay, long period, int callbackId) {
        if (delay < 0L || period < 0L) {
            throw new IllegalArgumentException("Task delay/period cannot be negative");
        }
        Runnable runnable = () -> {
            if (faulted) {
                return;
            }
            execute(requireExecutable("graaly_dispatch_task"), callbackId);
        };
        BukkitTask task;
        switch (kind) {
            case 0:
                task = owner.getServer().getScheduler().runTask(owner.asPlugin(), runnable);
                break;
            case 1:
                task = owner.getServer().getScheduler().runTaskLater(owner.asPlugin(), runnable, delay);
                break;
            case 2:
                if (period <= 0L) throw new IllegalArgumentException("Repeating task period must be positive");
                task = owner.getServer().getScheduler().runTaskTimer(owner.asPlugin(), runnable, delay, period);
                break;
            case 3:
                task = owner.getServer().getScheduler().runTaskAsynchronously(owner.asPlugin(), runnable);
                break;
            case 4:
                task = owner.getServer().getScheduler().runTaskLaterAsynchronously(owner.asPlugin(), runnable, delay);
                break;
            case 5:
                if (period <= 0L) throw new IllegalArgumentException("Repeating task period must be positive");
                task = owner.getServer().getScheduler().runTaskTimerAsynchronously(
                        owner.asPlugin(), runnable, delay, period);
                break;
            default:
                throw new IllegalArgumentException("Unknown C task schedule kind " + kind);
        }
        return task.getTaskId();
    }

    private Object moduleCall(String module, String operation, Object[] arguments) {
        GraalyScriptApi api = requireBridgeApi();
        switch (module) {
            case "config":
                return configModule(operation, arguments);
            case "players":
                return playersModule(operation, arguments);
            case "worlds":
                return worldsModule(operation, arguments);
            case "entities":
                return entitiesModule(operation, arguments);
            case "compatibility":
                return compatibilityModule(operation, arguments);
            case "diagnostics":
                if ("verify".equals(operation)) {
                    Map<String, Object> report = new LinkedHashMap<>();
                    report.put("apiSymbols", PolyglotTypeCatalog.apiNames().length);
                    report.put("wrappers", PolyglotTypeCatalog.packetWrapperNames().length);
                    report.put("packetTypes", PolyglotTypeCatalog.packetTypePaths().length);
                    int constants = 0;
                    for (String namespace : PolyglotTypeCatalog.constantNamespaceNames()) {
                        constants += PolyglotTypeCatalog.constantNames(namespace).length;
                    }
                    report.put("constants", constants);
                    return report;
                }
                break;
            case "packets":
                return packetModule(operation, arguments);
            case "ui":
                return uiModule(operation, arguments);
            case "boards":
                return boardsModule(operation, arguments);
            case "http":
                return httpModule(operation, arguments);
            case "websocket":
                return websocketModule(operation, arguments);
            case "commands":
                if ("dispatch".equals(operation)) {
                    CommandSender sender = arguments.length > 0 && arguments[0] instanceof CommandSender
                            ? (CommandSender) arguments[0]
                            : owner.getServer().getConsoleSender();
                    String command = requireString(arguments, 1, "command");
                    return owner.getServer().dispatchCommand(sender, command);
                }
                break;
            case "events":
            case "tasks":
                throw new IllegalArgumentException(
                        module + "." + operation + " uses the native C callback API, not module_call");
            default:
                break;
        }
        throw new IllegalArgumentException("Unknown Graaly C module operation " + module + "." + operation);
    }

    private Object configModule(String operation, Object[] arguments) {
        switch (operation) {
            case "get": {
                String path = requireString(arguments, 0, "path");
                Object value = owner.getConfig().get(path);
                return value == null && arguments.length > 1 ? arguments[1] : value;
            }
            case "set":
                owner.getConfig().set(requireString(arguments, 0, "path"),
                        arguments.length > 1 ? arguments[1] : null);
                return null;
            case "contains":
                return owner.getConfig().contains(requireString(arguments, 0, "path"));
            case "save":
                owner.saveConfig();
                return null;
            case "reload":
                owner.reloadConfig();
                return null;
            default:
                throw new IllegalArgumentException("Unknown config operation " + operation);
        }
    }

    private Object playersModule(String operation, Object[] arguments) {
        switch (operation) {
            case "online":
                return new ArrayList<>(owner.getServer().getOnlinePlayers());
            case "get":
                return owner.getServer().getPlayer(requireString(arguments, 0, "name"));
            case "exact":
                return owner.getServer().getPlayerExact(requireString(arguments, 0, "name"));
            case "isPlayer":
            case "is_player":
                return arguments.length > 0 && arguments[0] instanceof Player;
            case "broadcast":
                requireBridgeApi().broadcast(arguments.length == 0 ? "" : arguments[0]);
                return null;
            default:
                throw new IllegalArgumentException("Unknown players operation " + operation);
        }
    }

    private Object worldsModule(String operation, Object[] arguments) {
        switch (operation) {
            case "all":
                return owner.getServer().getWorlds();
            case "get":
                return owner.getServer().getWorld(requireString(arguments, 0, "name"));
            case "location": {
                Object type = requireBridgeApi().namedApiType("Location");
                return requireBridgeApi().construct(type, arguments);
            }
            case "unload": {
                Object selected = arguments.length > 0 ? arguments[0] : null;
                boolean save = arguments.length < 2 || Boolean.TRUE.equals(arguments[1]);
                if (selected instanceof String) {
                    return owner.getServer().unloadWorld((String) selected, save);
                }
                if (selected instanceof org.bukkit.World) {
                    return owner.getServer().unloadWorld((org.bukkit.World) selected, save);
                }
                return false;
            }
            case "create": {
                String name = requireString(arguments, 0, "world name");
                org.bukkit.WorldCreator creator = new org.bukkit.WorldCreator(name);
                GraalyScriptApi api = requireBridgeApi();
                for (int index = 1; index + 1 < arguments.length; index += 2) {
                    String key = String.valueOf(arguments[index]);
                    Object value = arguments[index + 1];
                    switch (key) {
                        case "seed":
                            if (!(value instanceof Number)) {
                                throw new IllegalArgumentException("world seed must be numeric");
                            }
                            creator.seed(((Number) value).longValue());
                            break;
                        case "environment":
                            if (value instanceof String) {
                                value = api.staticMember(api.namedApiType("WorldEnvironment"),
                                        ((String) value).trim().toUpperCase(java.util.Locale.ENGLISH));
                            }
                            creator.environment((org.bukkit.World.Environment) value);
                            break;
                        case "type":
                            if (value instanceof String) {
                                value = api.staticMember(api.namedApiType("WorldType"),
                                        ((String) value).trim().toUpperCase(java.util.Locale.ENGLISH));
                            }
                            creator.type((org.bukkit.WorldType) value);
                            break;
                        case "generateStructures":
                        case "generate_structures":
                            creator.generateStructures(Boolean.TRUE.equals(value));
                            break;
                        case "generatorSettings":
                        case "generator_settings":
                            creator.generatorSettings(String.valueOf(value));
                            break;
                        case "generator":
                            if (value != null && !(value instanceof org.bukkit.generator.ChunkGenerator)) {
                                throw new IllegalArgumentException("world generator must be a ChunkGenerator handle");
                            }
                            creator.generator((org.bukkit.generator.ChunkGenerator) value);
                            break;
                        default:
                            throw new IllegalArgumentException("Unknown worlds.create option " + key);
                    }
                }
                return creator.createWorld();
            }
            case "generator": {
                int generate = requireCallbackId(arguments, 0, "generate callback");
                Value canSpawn = optionalCallbackValue(arguments, 1);
                Value defaultPopulators = optionalCallbackValue(arguments, 2);
                Value fixedSpawn = optionalCallbackValue(arguments, 3);
                return requireBridgeApi().worldGenerator(
                        callbackValue(generate), canSpawn, defaultPopulators, fixedSpawn);
            }
            case "populator":
                return requireBridgeApi().blockPopulator(
                        callbackValue(requireCallbackId(arguments, 0, "populator callback")));
            default:
                throw new IllegalArgumentException("Unknown worlds operation " + operation);
        }
    }

    private Object entitiesModule(String operation, Object[] arguments) {
        switch (operation) {
            case "type":
                return requireBridgeApi().namedConstant(
                        "EntityType", requireString(arguments, 0, "entity type"));
            case "attributeType":
            case "attribute_type":
                requireBridgeApi().requireFeature("attributes");
                return requireBridgeApi().namedConstant(
                        "Attribute", requireString(arguments, 0, "attribute"));
            case "spawn": {
                if (arguments.length < 2 || !(arguments[0] instanceof org.bukkit.Location)) {
                    throw new IllegalArgumentException("entities.spawn requires Location and EntityType");
                }
                org.bukkit.Location location = (org.bukkit.Location) arguments[0];
                if (location.getWorld() == null) {
                    throw new IllegalArgumentException("entities.spawn location has no world");
                }
                return location.getWorld().spawnEntity(
                        location, (org.bukkit.entity.EntityType) arguments[1]);
            }
            case "attribute": {
                requireBridgeApi().requireFeature("attributes");
                Object entity = arguments[0];
                Object attribute = arguments[1] instanceof String
                        ? requireBridgeApi().namedConstant("Attribute", (String) arguments[1])
                        : arguments[1];
                Object instance = requireBridgeApi().invoke(entity, "getAttribute", attribute);
                if (instance != null && arguments.length > 2) {
                    requireBridgeApi().invoke(instance, "setBaseValue", arguments[2]);
                }
                return instance;
            }
            case "remove":
                requireBridgeApi().invoke(arguments[0], "remove");
                return null;
            case "configure": {
                if (arguments.length == 0) {
                    throw new IllegalArgumentException("entities.configure requires an entity");
                }
                Object entity = arguments[0];
                GraalyScriptApi api = requireBridgeApi();
                for (int index = 1; index + 1 < arguments.length; index += 2) {
                    String key = String.valueOf(arguments[index]);
                    Object value = arguments[index + 1];
                    String selected = key;
                    if ("name".equals(selected)) selected = "customName";
                    if ("nameVisible".equals(selected)) selected = "customNameVisible";

                    if (selected.startsWith("attribute:")) {
                        String attributeName = selected.substring("attribute:".length());
                        Object attribute = api.namedConstant("Attribute", attributeName);
                        Object instance = api.invoke(entity, "getAttribute", attribute);
                        if (instance != null) {
                            api.invoke(instance, "setBaseValue", value);
                        }
                        continue;
                    }

                    if (api.hasWritableProperty(entity, selected)) {
                        api.setProperty(entity, selected, value);
                        continue;
                    }

                    String method;
                    switch (selected) {
                        case "ai":
                            api.requireFeature("entity_ai");
                            method = "setAI";
                            break;
                        case "invulnerable":
                            api.requireFeature("entity_invulnerable");
                            method = "setInvulnerable";
                            break;
                        case "gravity":
                            api.requireFeature("entity_gravity");
                            method = "setGravity";
                            break;
                        case "glowing":
                            api.requireFeature("glowing");
                            method = "setGlowing";
                            break;
                        default:
                            throw new IllegalArgumentException(
                                    "Unknown entities.configure option " + key);
                    }
                    api.invoke(entity, method, value);
                }
                return entity;
            }
            default:
                throw new IllegalArgumentException("Unknown entities operation " + operation);
        }
    }

    private Object compatibilityModule(String operation, Object[] arguments) {
        switch (operation) {
            case "contractVersion":
            case "contract_version":
                return requireBridgeApi().contractVersion();
            case "minimumGameVersion":
            case "minimum_game_version":
                return requireBridgeApi().minimumGameVersion();
            case "minecraftVersion":
            case "minecraft_version":
                return requireBridgeApi().minecraftVersion();
            case "serverVersion":
            case "server_version":
                return requireBridgeApi().serverVersion();
            case "supports":
                return requireBridgeApi().supports(requireString(arguments, 0, "feature"));
            case "require":
                requireBridgeApi().requireFeature(requireString(arguments, 0, "feature"));
                return null;
            case "typeAvailable":
            case "type_available":
                return requireBridgeApi().typeAvailable(requireString(arguments, 0, "type"));
            case "material":
                return requireBridgeApi().material(requireString(arguments, 0, "material"));
            default:
                throw new IllegalArgumentException("Unknown compatibility operation " + operation);
        }
    }

    private Object packetModule(String operation, Object[] arguments) {
        PacketEventsScriptApi packets = requireBridgeApi().getPackets();
        switch (operation) {
            case "available":
                return packets.isAvailable();
            case "version":
                return packets.getVersion();
            case "wrapperType":
            case "wrapper_type":
                return packets.wrapperType(requireString(arguments, 0, "wrapper type"));
            case "namedType":
            case "named_type":
                return packets.namedType(requireString(arguments, 0, "PacketEvents type"));
            case "packetType":
            case "packet_type":
                return packets.packetType(arguments[0]);
            case "create":
                return packets.create(arguments[0],
                        java.util.Arrays.copyOfRange(arguments, 1, arguments.length));
            case "wrap":
                return packets.wrap(arguments[0], arguments[1]);
            case "send":
                packets.send(arguments[0], arguments[1]);
                return null;
            case "sendToAll":
            case "send_to_all":
                for (Player player : owner.getServer().getOnlinePlayers()) {
                    packets.send(player, arguments[0]);
                }
                return null;
            case "receive":
                packets.receive(arguments[0], arguments[1]);
                return null;
            case "user":
                return packets.user(arguments[0]);
            case "clientVersion":
            case "client_version":
                return packets.clientVersion(arguments[0]);
            case "ping":
                return packets.ping(arguments[0]);
            case "onReceive":
            case "on_receive": {
                Object packetType = arguments.length > 0 ? arguments[0] : null;
                String priority = arguments.length > 1 && arguments[1] != null
                        ? String.valueOf(arguments[1]) : "NORMAL";
                int callbackId = requireCallbackId(arguments, 2, "packet receive callback");
                return packets.onReceive(packetType, priority, callbackValue(callbackId));
            }
            case "onSend":
            case "on_send": {
                Object packetType = arguments.length > 0 ? arguments[0] : null;
                String priority = arguments.length > 1 && arguments[1] != null
                        ? String.valueOf(arguments[1]) : "NORMAL";
                int callbackId = requireCallbackId(arguments, 2, "packet send callback");
                return packets.onSend(packetType, priority, callbackValue(callbackId));
            }
            default:
                throw new IllegalArgumentException("Unknown packets operation " + operation);
        }
    }

    private Object uiModule(String operation, Object[] arguments) {
        GraalyUiScriptApi ui = requireBridgeApi().getUi();
        switch (operation) {
            case "clear":
                ui.clear(arguments[0]);
                return null;
            case "dismiss":
                ui.dismiss(arguments[0], requireString(arguments, 1, "surface"));
                return null;
            case "render": {
                int callbackId = requireCallbackId(arguments, 2, "UI callback");
                ui.render(arguments[0], requireString(arguments, 1, "snapshot JSON"),
                        callbackValue(callbackId));
                return null;
            }
            case "renderHtml":
            case "render_html": {
                String snapshot = ui.compileHtml(
                        requireString(arguments, 1, "markup"),
                        arguments.length > 2 && arguments[2] != null ? String.valueOf(arguments[2]) : "");
                int callbackId = requireCallbackId(arguments, 3, "UI callback");
                ui.render(arguments[0], snapshot, callbackValue(callbackId));
                return null;
            }
            default:
                throw new IllegalArgumentException("Unknown ui operation " + operation);
        }
    }

    private Object boardsModule(String operation, Object[] arguments) {
        switch (operation) {
            case "state":
                requireBridgeApi().publishWebState(
                        requireString(arguments, 0, "board"),
                        arguments[1],
                        requireString(arguments, 2, "state JSON"));
                return null;
            case "refresh":
                requireBridgeApi().refreshWebBoard(
                        requireString(arguments, 0, "board"), arguments[1]);
                return null;
            case "onMessage":
            case "on_message":
            case "listen":
                requireBridgeApi().onWebMessage(
                        requireString(arguments, 0, "board"),
                        callbackValue(requireCallbackId(arguments, 1, "board message callback")));
                return null;
            default:
                throw new IllegalArgumentException("Unknown boards operation " + operation);
        }
    }

    private Object httpModule(String operation, Object[] arguments) {
        GraalyHttpScriptApi http = requireBridgeApi().getHttp();
        if ("cancel".equals(operation)) {
            return http.cancel(requireString(arguments, 0, "request id"));
        }

        String method;
        String url;
        String headers;
        String body;
        long timeout;
        int callbackId;
        switch (operation) {
            case "request":
                method = requireString(arguments, 0, "method");
                url = requireString(arguments, 1, "url");
                headers = optionalString(arguments, 2, "{}");
                body = arguments.length > 3 && arguments[3] != null ? String.valueOf(arguments[3]) : null;
                timeout = optionalLong(arguments, 4, 15_000L);
                callbackId = requireCallbackId(arguments, 5, "HTTP callback");
                break;
            case "get":
            case "delete":
                method = operation.toUpperCase(java.util.Locale.ENGLISH);
                url = requireString(arguments, 0, "url");
                headers = optionalString(arguments, 1, "{}");
                body = null;
                timeout = optionalLong(arguments, 2, 15_000L);
                callbackId = requireCallbackId(arguments, 3, "HTTP callback");
                break;
            case "post":
            case "put":
                method = operation.toUpperCase(java.util.Locale.ENGLISH);
                url = requireString(arguments, 0, "url");
                body = arguments.length > 1 && arguments[1] != null ? String.valueOf(arguments[1]) : "";
                headers = optionalString(arguments, 2, "{}");
                timeout = optionalLong(arguments, 3, 15_000L);
                callbackId = requireCallbackId(arguments, 4, "HTTP callback");
                break;
            default:
                throw new IllegalArgumentException("Unknown http operation " + operation);
        }
        return http.request(method, url, headers, body, timeout, callbackValue(callbackId));
    }

    private Object websocketModule(String operation, Object[] arguments) {
        GraalyWebSocketScriptApi websocket = requireBridgeApi().getWebSocket();
        switch (operation) {
            case "connect":
                return websocket.open(
                        requireString(arguments, 0, "url"),
                        optionalString(arguments, 1, "{}"),
                        optionalLong(arguments, 2, 15_000L),
                        callbackValue(requireCallbackId(arguments, 3, "WebSocket event callback")));
            case "send":
                websocket.send(
                        requireString(arguments, 0, "connection id"),
                        requireString(arguments, 1, "text"),
                        callbackValue(requireCallbackId(arguments, 2, "WebSocket send callback")));
                return null;
            case "close":
                websocket.close(
                        requireString(arguments, 0, "connection id"),
                        arguments.length > 1 && arguments[1] instanceof Number
                                ? ((Number) arguments[1]).intValue() : 1000,
                        optionalString(arguments, 2, ""),
                        callbackValue(requireCallbackId(arguments, 3, "WebSocket close callback")));
                return null;
            case "state":
                return websocket.state(requireString(arguments, 0, "connection id"));
            default:
                throw new IllegalArgumentException("Unknown websocket operation " + operation);
        }
    }

    private Value optionalCallbackValue(Object[] arguments, int index) {
        if (index >= arguments.length || arguments[index] == null) {
            return null;
        }
        if (arguments[index] instanceof Number
                && ((Number) arguments[index]).longValue() == 0L) {
            return null;
        }
        return callbackValue(requireCallbackId(arguments, index, "callback"));
    }

    private int requireCallbackId(Object[] arguments, int index, String label) {
        if (index >= arguments.length || !(arguments[index] instanceof Number)) {
            throw new IllegalArgumentException(label + " id is required");
        }
        long value = ((Number) arguments[index]).longValue();
        if (value <= 0L || value > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(label + " id is invalid: " + value);
        }
        return (int) value;
    }

    private String optionalString(Object[] arguments, int index, String fallback) {
        return index < arguments.length && arguments[index] != null
                ? String.valueOf(arguments[index]) : fallback;
    }

    private long optionalLong(Object[] arguments, int index, long fallback) {
        if (index >= arguments.length || arguments[index] == null) {
            return fallback;
        }
        if (!(arguments[index] instanceof Number)) {
            throw new IllegalArgumentException("Expected numeric argument at index " + index);
        }
        return ((Number) arguments[index]).longValue();
    }

    private String requireString(Object[] arguments, int index, String label) {
        if (index >= arguments.length || arguments[index] == null) {
            throw new IllegalArgumentException(label + " is required");
        }
        return String.valueOf(arguments[index]);
    }

    private void registerEventCallback(int eventId, int callbackId) {
        if (callbackId <= 0) {
            throw new IllegalArgumentException("C callback id must be positive");
        }
        List<Integer> callbacks = eventCallbacks.computeIfAbsent(eventId, ignored -> {
            registerBukkitEvent(eventId);
            return new ArrayList<>();
        });
        if (!callbacks.contains(callbackId)) {
            callbacks.add(callbackId);
        }
    }

    private void registerBukkitEvent(int eventId) {
        final Class<? extends Event> eventClass;
        switch (eventId) {
            case EVENT_PLAYER_JOIN:
                eventClass = PlayerJoinEvent.class;
                break;
            case EVENT_PLAYER_QUIT:
                eventClass = PlayerQuitEvent.class;
                break;
            default:
                throw new IllegalArgumentException("Unsupported Graaly C event id " + eventId);
        }

        owner.getServer().getPluginManager().registerEvent(
                eventClass,
                eventListener,
                EventPriority.NORMAL,
                (ignored, event) -> {
                    try {
                        dispatchEvent(eventId, event);
                    } catch (Throwable failure) {
                        throw new EventException(failure);
                    }
                },
                owner.asPlugin(),
                false
        );
    }

    private void dispatchEvent(int eventId, Event event) {
        if (faulted) {
            return;
        }
        List<Integer> callbacks = eventCallbacks.get(eventId);
        if (callbacks == null || callbacks.isEmpty()) {
            return;
        }

        Player player;
        if (event instanceof PlayerJoinEvent) {
            player = ((PlayerJoinEvent) event).getPlayer();
        } else if (event instanceof PlayerQuitEvent) {
            player = ((PlayerQuitEvent) event).getPlayer();
        } else {
            throw new IllegalArgumentException("Unsupported C event object " + event.getClass().getName());
        }

        Value dispatcher = requireExecutable("graaly_dispatch_event");
        long playerHandle = openHandle(player);
        try {
            for (int callbackId : new ArrayList<>(callbacks)) {
                execute(dispatcher, callbackId, eventId, playerHandle);
            }
        } finally {
            closeHandle(playerHandle);
        }
    }

    private int guestAlloc(int size) {
        if (size < 0 || size > MAX_COMMAND_PAYLOAD) {
            throw new IllegalArgumentException("Invalid C guest allocation size " + size);
        }
        Value allocation = requireExecutable("graaly_alloc").execute(size);
        int pointer = allocation.asInt();
        requireRange(pointer, Math.max(size, 1));
        return pointer;
    }

    private void guestFree(int pointer) {
        Value free = optionalExecutable("graaly_free");
        if (free != null) {
            execute(free, pointer);
        }
    }

    private long openHandle(Object value) {
        long id = nextHandle.getAndIncrement();
        if (id == 0L) {
            id = nextHandle.getAndIncrement();
        }
        handles.put(id, value);
        return id;
    }

    private void closeHandle(long handle) {
        handles.remove(handle);
    }

    private <T> T requireHandle(long handle, Class<T> type) {
        Object value = handles.get(handle);
        if (value == null) {
            throw new IllegalArgumentException("stale or forged Graaly C handle 0x"
                    + Long.toHexString(handle));
        }
        if (!type.isInstance(value)) {
            throw new IllegalArgumentException("Graaly C handle 0x"
                    + Long.toHexString(handle) + " is " + value.getClass().getSimpleName()
                    + ", not " + type.getSimpleName());
        }
        return type.cast(value);
    }

    private String readUtf8(int pointer, int length, int maximum) {
        long unsignedLength = Integer.toUnsignedLong(length);
        if (unsignedLength > maximum) {
            throw new IllegalArgumentException("C string length " + unsignedLength
                    + " exceeds host limit " + maximum);
        }
        int count = (int) unsignedLength;
        long start = requireRange(pointer, count);
        byte[] bytes = new byte[count];
        memory.readBuffer(start, bytes, 0, count);
        return new String(bytes, StandardCharsets.UTF_8);
    }

    /**
     * Writes a normal NUL-terminated C string and returns the full UTF-8 byte
     * length. The C caller can therefore learn about truncation with
     * {@code required >= capacity}, just like common size-aware C APIs.
     */
    private int writeCString(String value, int pointer, int capacity) {
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        long unsignedCapacity = Integer.toUnsignedLong(capacity);
        if (unsignedCapacity == 0L) {
            return bytes.length;
        }
        if (unsignedCapacity > MAX_HOST_STRING) {
            throw new IllegalArgumentException("C destination capacity exceeds " + MAX_HOST_STRING);
        }

        int cap = (int) unsignedCapacity;
        long start = requireRange(pointer, cap);
        int copy = Math.min(bytes.length, cap - 1);
        for (int index = 0; index < copy; index++) {
            memory.writeBufferByte(start + index, bytes[index]);
        }
        memory.writeBufferByte(start + copy, (byte) 0);
        return bytes.length;
    }

    private void writeBytes(int pointer, byte[] bytes) {
        long start = requireRange(pointer, bytes.length);
        for (int index = 0; index < bytes.length; index++) {
            memory.writeBufferByte(start + index, bytes[index]);
        }
    }

    private long requireRange(int pointer, int length) {
        if (memory == null) {
            throw new IllegalStateException("C linear memory is not available");
        }
        if (length < 0) {
            throw new IllegalArgumentException("negative C memory length");
        }
        long start = Integer.toUnsignedLong(pointer);
        long end = start + (long) length;
        if (end < start || end > memory.getBufferSize()) {
            throw new IndexOutOfBoundsException("C/Wasm memory access out of bounds: ptr=0x"
                    + Integer.toUnsignedString(pointer, 16) + " len=" + length
                    + " memory=" + memory.getBufferSize());
        }
        return start;
    }

    private int checkedPointer(long pointer) {
        if (pointer < 0L || pointer > 0xffff_ffffL) {
            throw new IllegalArgumentException("Wasm32 pointer overflow: " + pointer);
        }
        return (int) pointer;
    }

    private Value requireMember(Value parent, String name, String description) {
        Value value = parent == null ? null : parent.getMember(name);
        if (value == null) {
            throw new IllegalStateException("Missing " + description);
        }
        return value;
    }

    private Value requireExecutable(String name) {
        Value value = optionalExecutable(name);
        if (value == null) {
            throw new IllegalStateException("C plugin " + owner.getName()
                    + " does not export required function " + name);
        }
        return value;
    }

    private Value optionalExecutable(String name) {
        if (exports == null || !exports.hasMember(name)) {
            return null;
        }
        Value value = exports.getMember(name);
        return value != null && value.canExecute() ? value : null;
    }

    private Value executeOptional(String name) {
        Value value = optionalExecutable(name);
        return value == null ? null : execute(value);
    }

    private synchronized Value execute(Value function, Object... arguments) {
        if (faulted) {
            throw new IllegalStateException("C/Wasm plugin " + owner.getName()
                    + " is faulted; reload it after fixing the C code");
        }
        try {
            return function.execute(arguments);
        } catch (PolyglotException failure) {
            faulted = true;
            String raw = failure.getMessage() == null ? "" : failure.getMessage().toLowerCase();
            boolean memoryFault = raw.contains("out of bounds")
                    || raw.contains("memory")
                    || raw.contains("segmentation");
            String kind = memoryFault
                    ? "Segmentation fault [WebAssembly sandbox]"
                    : "C/WebAssembly guest trap";
            owner.getLogger().log(Level.SEVERE,
                    kind + " in " + owner.getName()
                            + ". The guest is quarantined until /graaly reload; "
                            + "the JVM was not given a native C pointer. Check pointer arithmetic, "
                            + "buffer bounds, function pointers, and memory lifetime.",
                    failure);
            throw failure;
        }
    }

    @Override
    public void close() {
        HandlerList.unregisterAll(eventListener);
        eventCallbacks.clear();
        handles.clear();
        if (bridgeApi != null) {
            bridgeApi.clear();
            bridgeApi = null;
        }
        instance = null;
        exports = null;
        memory = null;
        faulted = false;
        if (context != null) {
            try {
                context.close(true);
            } finally {
                context = null;
            }
        }
    }
}
