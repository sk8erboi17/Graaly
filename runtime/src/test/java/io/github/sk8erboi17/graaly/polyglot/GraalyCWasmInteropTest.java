package io.github.sk8erboi17.graaly.polyglot;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.io.ByteSequence;
import org.graalvm.polyglot.proxy.ProxyExecutable;
import org.graalvm.polyglot.proxy.ProxyObject;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GraalyCWasmInteropTest {
    @Test
    void wasmModuleCanImportAJavaHostFunction() throws Exception {
        byte[] wasm;
        try (InputStream input = getClass().getResourceAsStream("/c/host-import.wasm")) {
            assertNotNull(input, "missing C/Wasm interop fixture");
            wasm = input.readAllBytes();
        }

        try (Context context = Context.newBuilder("wasm").build()) {
            Source source = Source.newBuilder(
                            "wasm",
                            ByteSequence.create(wasm),
                            "c-host-import-test")
                    .build();

            Value module = context.eval(source);
            ProxyExecutable add = arguments ->
                    arguments[0].asInt() + arguments[1].asInt();
            ProxyObject imports = ProxyObject.fromMap(Map.of(
                    "graaly",
                    ProxyObject.fromMap(Map.of("add", add))));

            Value instance = module.newInstance(imports);
            Value exports = instance.getMember("exports");
            assertEquals(42, exports.getMember("call_add").execute(19, 23).asInt());
        }
    }
}
