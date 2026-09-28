package io.github.sk8erboi17.graaly.polyglot;

import org.graalvm.polyglot.Context;
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
import org.junit.jupiter.api.Test;

import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GraalyCEducationalExampleTest {
    @Test
    void compiledEducationalPluginInstantiatesAndUsesTheCAbi() throws Exception {
        Path plugin = Path.of("examples", "EducationalC.cplugin", "dist", "plugin.wasm");
        byte[] wasm = Files.readAllBytes(plugin);

        AtomicReference<Value> memoryRef = new AtomicReference<>();
        AtomicReference<String> lastMessage = new AtomicReference<>();
        List<String> bridgeCalls = new ArrayList<>();

        Map<String, Object> host = new LinkedHashMap<>();
        host.put("log", (ProxyExecutable) args -> 0);
        host.put("sender_send_message", (ProxyExecutable) args -> {
            Value memory = memoryRef.get();
            assertNotNull(memory);
            int pointer = args[1].asInt();
            int length = args[2].asInt();
            byte[] bytes = new byte[length];
            memory.readBuffer(Integer.toUnsignedLong(pointer), bytes, 0, length);
            lastMessage.set(new String(bytes, StandardCharsets.UTF_8));
            return 0;
        });
        host.put("sender_as_player", (ProxyExecutable) args -> 0L);
        host.put("player_name", (ProxyExecutable) args -> 0);
        host.put("player_uuid", (ProxyExecutable) args -> 0);
        host.put("player_health", (ProxyExecutable) args -> 20.0);
        host.put("player_level", (ProxyExecutable) args -> 0);
        host.put("listen", (ProxyExecutable) args -> 0);
        host.put("bridge", (ProxyExecutable) args -> {
            Value memory = memoryRef.get();
            assertNotNull(memory);
            int operation = args[0].asInt();
            if (operation == 1) {
                String type = readUtf8(memory, args[1].asInt(), args[2].asInt());
                bridgeCalls.add("type:" + type);
                writeHandleValue(memory, args[3].asInt(), 9001L);
                return 0;
            }
            if (operation == 2) {
                String namespace = readUtf8(memory, args[1].asInt(), args[2].asInt());
                String constant = readUtf8(memory, args[3].asInt(), args[4].asInt());
                bridgeCalls.add("constant:" + namespace + "." + constant);
                writeHandleValue(memory, args[5].asInt(), 9002L);
                return 0;
            }
            if (operation == 23) {
                bridgeCalls.add("release:" + args[1].asLong());
                return 0;
            }
            return 0;
        });

        try (Context context = Context.newBuilder("wasm")
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
                .build()) {
            Source source = Source.newBuilder(
                            "wasm",
                            ByteSequence.create(wasm),
                            "educational-c")
                    .build();

            Value module = context.eval(source);
            ProxyObject imports = ProxyObject.fromMap(Map.of(
                    "graaly", ProxyObject.fromMap(host)));
            Value instance = module.newInstance(imports);
            Value exports = instance.getMember("exports");
            Value memory = exports.getMember("memory");
            memoryRef.set(memory);

            assertTrue(memory.hasBufferElements());
            if (exports.hasMember("_initialize")) {
                exports.getMember("_initialize").execute();
            }
            assertEquals(1, exports.getMember("graaly_abi_version").execute().asInt());

            exports.getMember("graaly_plugin_load").execute();
            exports.getMember("graaly_plugin_enable").execute();

            assertEquals(1, dispatchCommand(exports, memory, "ccatalog"));
            assertNotNull(lastMessage.get());
            assertTrue(lastMessage.get().contains("Player=ok"), lastMessage::get);
            assertTrue(lastMessage.get().contains("Material.STONE=ok"), lastMessage::get);
            assertTrue(bridgeCalls.contains("type:Player"), bridgeCalls::toString);
            assertTrue(bridgeCalls.contains("constant:Material.STONE"), bridgeCalls::toString);
            assertTrue(bridgeCalls.contains("release:9001"), bridgeCalls::toString);
            assertTrue(bridgeCalls.contains("release:9002"), bridgeCalls::toString);

            lastMessage.set(null);
            assertEquals(1, dispatchCommand(exports, memory, "cmemory"));
            assertTrue(lastMessage.get().contains("DEADBEEF")
                            || lastMessage.get().contains("canary=0xDEADBEEF"),
                    lastMessage::get);

            lastMessage.set(null);
            assertEquals(1, dispatchCommand(exports, memory, "cheap"));
            assertNotNull(lastMessage.get());
            assertTrue(lastMessage.get().contains("after=already-freed"), lastMessage::get);
            assertTrue(lastMessage.get().contains("double-free=already-freed"), lastMessage::get);
            assertTrue(lastMessage.get().contains("poison=0xDEADBEEF"), lastMessage::get);

            lastMessage.set(null);
            assertEquals(1, dispatchCommand(exports, memory, "coverflow"));
            assertNotNull(lastMessage.get());
            assertTrue(lastMessage.get().contains("buffer-overflow"), lastMessage::get);

            assertThrows(PolyglotException.class,
                    () -> dispatchCommand(exports, memory, "csegfault"));

            exports.getMember("graaly_plugin_disable").execute();
        }
    }

    private static String readUtf8(Value memory, int pointer, int length) {
        byte[] bytes = new byte[length];
        memory.readBuffer(Integer.toUnsignedLong(pointer), bytes, 0, length);
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private static void writeHandleValue(Value memory, int pointer, long handle) {
        long address = Integer.toUnsignedLong(pointer);
        memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, address, 5);
        memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, address + 4L, 0);
        memory.writeBufferLong(ByteOrder.LITTLE_ENDIAN, address + 8L, handle);
        memory.writeBufferLong(ByteOrder.LITTLE_ENDIAN, address + 16L, 0L);
    }

    private static int dispatchCommand(Value exports, Value memory, String name) {
        byte[] command = name.getBytes(StandardCharsets.UTF_8);
        int block = exports.getMember("graaly_alloc").execute(command.length).asInt();
        long address = Integer.toUnsignedLong(block);
        for (int index = 0; index < command.length; index++) {
            memory.writeBufferByte(address + index, command[index]);
        }

        try {
            return exports.getMember("graaly_dispatch_command")
                    .execute(123L, block, command.length, 0, block)
                    .asInt();
        } finally {
            exports.getMember("graaly_free").execute(block);
        }
    }
}
