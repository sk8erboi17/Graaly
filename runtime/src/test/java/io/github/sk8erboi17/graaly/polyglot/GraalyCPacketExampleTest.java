package io.github.sk8erboi17.graaly.polyglot;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.io.ByteSequence;
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

import static io.github.sk8erboi17.graaly.polyglot.GraalyCEducationalExampleTest.readUtf8;
import static io.github.sk8erboi17.graaly.polyglot.GraalyCEducationalExampleTest.writeHandleValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GraalyCPacketExampleTest {
    @Test
    void cPacketPluginChecksAvailabilityReadsVersionAndOwnsItsBindings() throws Exception {
        byte[] wasm = Files.readAllBytes(Path.of("examples", "PacketEventsC.cplugin", "dist", "plugin.wasm"));
        for (boolean available : new boolean[] { false, true }) {
            AtomicReference<Value> memoryRef = new AtomicReference<>();
            List<String> operations = new ArrayList<>();
            List<Long> released = new ArrayList<>();
            List<String> logs = new ArrayList<>();
            Map<String, Object> host = new LinkedHashMap<>();
            host.put("log", (ProxyExecutable) args -> {
                logs.add(readUtf8(memoryRef.get(), args[1].asInt(), args[2].asInt()));
                return 0;
            });
            host.put("sender_send_message", (ProxyExecutable) args -> 0);
            host.put("sender_as_player", (ProxyExecutable) args -> 7001L);
            host.put("bridge", (ProxyExecutable) args -> {
                Value memory = memoryRef.get();
                int operation = args[0].asInt();
                if (operation == 29) {
                    assertEquals("packets", readUtf8(memory, args[1].asInt(), args[2].asInt()));
                    String member = readUtf8(memory, args[3].asInt(), args[4].asInt());
                    operations.add(member);
                    long request = Integer.toUnsignedLong(args[5].asInt());
                    int result = memory.readBufferInt(ByteOrder.LITTLE_ENDIAN, request + 8L);
                    if ("available".equals(member)) {
                        writeHandleValue(memory, result, available ? 1L : 0L);
                        memory.writeBufferInt(ByteOrder.LITTLE_ENDIAN, Integer.toUnsignedLong(result), 1);
                    } else if ("version".equals(member)) {
                        writeHandleValue(memory, result, 9003L);
                    } else if ("packetType".equals(member)) {
                        writeHandleValue(memory, result, 1001L);
                    } else if ("onReceive".equals(member)) {
                        writeHandleValue(memory, result, 2001L);
                    } else if ("onSend".equals(member)) {
                        writeHandleValue(memory, result, 2002L);
                    } else throw new AssertionError("unexpected packet operation: " + member);
                    return 0;
                }
                if (operation == 27) {
                    assertEquals(9003L, args[1].asLong());
                    byte[] text = "2.13.0".getBytes(StandardCharsets.UTF_8);
                    long pointer = Integer.toUnsignedLong(args[2].asInt());
                    assertTrue(args[3].asInt() > text.length);
                    for (int index = 0; index < text.length; index++) memory.writeBufferByte(pointer + index, text[index]);
                    memory.writeBufferByte(pointer + text.length, (byte) 0);
                    return text.length;
                }
                if (operation == 23) {
                    released.add(args[1].asLong());
                    return 0;
                }
                throw new AssertionError("unexpected bridge operation: " + operation);
            });
            try (Context context = Context.newBuilder("wasm").option("wasm.Builtins", "wasi_snapshot_preview1").build()) {
                Value module = context.eval(Source.newBuilder("wasm", ByteSequence.create(wasm), "packetevents-c").build());
                Value exports = module.newInstance(ProxyObject.fromMap(Map.of("graaly", ProxyObject.fromMap(host)))).getMember("exports");
                memoryRef.set(exports.getMember("memory"));
                if (exports.hasMember("_initialize")) exports.getMember("_initialize").execute();
                exports.getMember("graaly_plugin_enable").execute();
                if (available) {
                    assertEquals(List.of("available", "version", "packetType", "onReceive", "packetType", "onSend"), operations);
                    assertTrue(logs.contains("2.13.0"), logs::toString);
                    assertTrue(released.contains(9003L), released::toString);
                    exports.getMember("graaly_plugin_disable").execute();
                    assertTrue(released.containsAll(List.of(2001L, 2002L)), released::toString);
                } else {
                    assertEquals(List.of("available"), operations);
                    assertTrue(logs.contains("PacketEvents is unavailable"), logs::toString);
                    assertTrue(released.isEmpty(), released::toString);
                }
            }
        }
    }
}
