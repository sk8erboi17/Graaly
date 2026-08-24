package io.github.sk8erboi17.graaly.polyglot;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

/**
 * Immutable symbol catalog shared by the JavaScript and Python language SDKs.
 *
 * <p>The catalog contains names only. In particular, PacketEvents remains a
 * separately installed plugin and none of its bytecode is redistributed in
 * the Graaly server JAR.</p>
 */
final class PolyglotTypeCatalog {
    private static final Map<String, String> API_TYPES = loadProperties("/polyglot/api-types.properties");
    private static final Map<String, String> PACKET_WRAPPERS = loadProperties("/polyglot/packetevents-wrappers.properties");
    private static final Map<String, String> PACKET_SUPPORT_TYPES = loadProperties("/polyglot/packetevents-types.properties");
    private static final List<String> PACKET_TYPES = loadLines("/polyglot/packetevents-packet-types.txt");
    private static final Map<String, ConstantNamespace> CONSTANT_NAMESPACES =
            loadConstantNamespaces("/polyglot/latest-constants.json");
    private static final Map<String, CanonicalMembers> API_MEMBERS =
            loadCanonicalMembers("/polyglot/latest-api-members.json");

    private PolyglotTypeCatalog() {
    }

    static String apiClass(String exportedName) {
        return API_TYPES.get(exportedName);
    }

    static String packetWrapperClass(String exportedName) {
        return PACKET_WRAPPERS.get(exportedName);
    }

    static String packetSupportClass(String exportedName) {
        return PACKET_SUPPORT_TYPES.get(exportedName);
    }

    static String[] apiNames() {
        return API_TYPES.keySet().toArray(new String[0]);
    }

    static String[] packetWrapperNames() {
        return PACKET_WRAPPERS.keySet().toArray(new String[0]);
    }

    static String[] packetSupportNames() {
        return PACKET_SUPPORT_TYPES.keySet().toArray(new String[0]);
    }

    static String[] packetTypePaths() {
        return PACKET_TYPES.toArray(new String[0]);
    }

    static String[] constantNamespaceNames() {
        return CONSTANT_NAMESPACES.keySet().toArray(new String[0]);
    }

    static String constantRuntimeType(String namespace) {
        ConstantNamespace selected = CONSTANT_NAMESPACES.get(namespace);
        return selected == null ? null : selected.runtimeType;
    }

    static String constantRuntimeTypeForExport(String exportedName) {
        if (exportedName == null) {
            return null;
        }
        String requested = exportedName.trim();
        for (Map.Entry<String, ConstantNamespace> entry : CONSTANT_NAMESPACES.entrySet()) {
            String namespace = entry.getKey();
            ConstantNamespace definition = entry.getValue();
            String runtimeType = definition.runtimeType;
            int separator = Math.max(runtimeType.lastIndexOf('.'), runtimeType.lastIndexOf('$'));
            String simpleName = runtimeType.substring(separator + 1);
            String singularNamespace = namespace.endsWith("s")
                    ? namespace.substring(0, namespace.length() - 1)
                    : namespace;
            if (namespace.equalsIgnoreCase(requested)
                    || definition.plural.equalsIgnoreCase(requested)
                    || singularNamespace.equalsIgnoreCase(requested)
                    || simpleName.equalsIgnoreCase(requested)) {
                return runtimeType;
            }
        }
        return null;
    }

    static String[] constantNames(String namespace) {
        ConstantNamespace selected = CONSTANT_NAMESPACES.get(namespace);
        return selected == null ? new String[0] : selected.names.toArray(new String[0]);
    }

    static boolean hasConstant(String namespace, String name) {
        ConstantNamespace selected = CONSTANT_NAMESPACES.get(namespace);
        return selected != null && selected.names.contains(name);
    }

    static String canonicalInstanceOwner(Object target, String name) {
        return canonicalOwner(target, name, MemberKind.INSTANCE);
    }

    static String canonicalWritableOwner(Object target, String name) {
        return canonicalOwner(target, name, MemberKind.WRITABLE);
    }

    static String canonicalStaticOwner(Object target, String name) {
        return canonicalOwner(target, name, MemberKind.STATIC);
    }

    private static String canonicalOwner(Object target, String name, MemberKind kind) {
        if (target == null || name == null || name.isEmpty()) {
            return null;
        }
        Class<?> type = target instanceof Class<?> ? (Class<?>) target : target.getClass();
        return canonicalOwner(type, name, kind, new HashSet<>());
    }

    private static String canonicalOwner(Class<?> type, String name, MemberKind kind, Set<Class<?>> visited) {
        if (type == null || !visited.add(type)) {
            return null;
        }
        CanonicalMembers members = API_MEMBERS.get(type.getName());
        if (members != null && kind.values(members).contains(name)) {
            return type.getName();
        }
        for (Class<?> contract : type.getInterfaces()) {
            String owner = canonicalOwner(contract, name, kind, visited);
            if (owner != null) {
                return owner;
            }
        }
        return canonicalOwner(type.getSuperclass(), name, kind, visited);
    }

    private static Map<String, String> loadProperties(String resource) {
        Properties properties = new Properties();
        try (InputStream input = requireResource(resource);
             InputStreamReader reader = new InputStreamReader(input, StandardCharsets.UTF_8)) {
            properties.load(reader);
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
        List<String> names = new ArrayList<>(properties.stringPropertyNames());
        Collections.sort(names);
        Map<String, String> result = new LinkedHashMap<>();
        for (String name : names) {
            result.put(name, properties.getProperty(name));
        }
        return Collections.unmodifiableMap(result);
    }

    private static List<String> loadLines(String resource) {
        List<String> result = new ArrayList<>();
        try (InputStream input = requireResource(resource);
             BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String value = line.trim();
                if (!value.isEmpty() && !value.startsWith("#")) {
                    result.add(value);
                }
            }
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
        Collections.sort(result);
        return Collections.unmodifiableList(result);
    }

    private static Map<String, ConstantNamespace> loadConstantNamespaces(String resource) {
        try (InputStream input = requireResource(resource);
             InputStreamReader reader = new InputStreamReader(input, StandardCharsets.UTF_8)) {
            JsonObject namespaces = JsonParser.parseReader(reader).getAsJsonObject()
                    .getAsJsonObject("namespaces");
            Map<String, ConstantNamespace> result = new LinkedHashMap<>();
            for (Map.Entry<String, JsonElement> entry : namespaces.entrySet()) {
                JsonObject definition = entry.getValue().getAsJsonObject();
                List<String> names = new ArrayList<>();
                for (JsonElement value : definition.getAsJsonArray("constants")) {
                    names.add(value.getAsString());
                }
                result.put(entry.getKey(), new ConstantNamespace(
                        definition.get("runtimeType").getAsString(),
                        definition.get("plural").getAsString(),
                        Collections.unmodifiableList(names)
                ));
            }
            return Collections.unmodifiableMap(result);
        } catch (IOException | RuntimeException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    private static Map<String, CanonicalMembers> loadCanonicalMembers(String resource) {
        try (InputStream input = requireResource(resource);
             InputStreamReader reader = new InputStreamReader(input, StandardCharsets.UTF_8)) {
            JsonObject classes = JsonParser.parseReader(reader).getAsJsonObject().getAsJsonObject("classes");
            Map<String, CanonicalMembers> result = new LinkedHashMap<>();
            for (Map.Entry<String, JsonElement> entry : classes.entrySet()) {
                JsonObject definition = entry.getValue().getAsJsonObject();
                result.put(entry.getKey(), new CanonicalMembers(
                        jsonStrings(definition, "instance"),
                        jsonStrings(definition, "writable"),
                        jsonStrings(definition, "static")
                ));
            }
            return Collections.unmodifiableMap(result);
        } catch (IOException | RuntimeException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    private static Set<String> jsonStrings(JsonObject definition, String name) {
        Set<String> values = new HashSet<>();
        for (JsonElement value : definition.getAsJsonArray(name)) {
            values.add(value.getAsString());
        }
        return Collections.unmodifiableSet(values);
    }

    private static final class ConstantNamespace {
        private final String runtimeType;
        private final String plural;
        private final List<String> names;

        private ConstantNamespace(String runtimeType, String plural, List<String> names) {
            this.runtimeType = runtimeType;
            this.plural = plural;
            this.names = names;
        }
    }

    private static final class CanonicalMembers {
        private final Set<String> instance;
        private final Set<String> writable;
        private final Set<String> staticMembers;

        private CanonicalMembers(Set<String> instance, Set<String> writable, Set<String> staticMembers) {
            this.instance = instance;
            this.writable = writable;
            this.staticMembers = staticMembers;
        }
    }

    private enum MemberKind {
        INSTANCE {
            @Override Set<String> values(CanonicalMembers members) { return members.instance; }
        },
        WRITABLE {
            @Override Set<String> values(CanonicalMembers members) { return members.writable; }
        },
        STATIC {
            @Override Set<String> values(CanonicalMembers members) { return members.staticMembers; }
        };

        abstract Set<String> values(CanonicalMembers members);
    }

    private static InputStream requireResource(String name) throws IOException {
        InputStream input = PolyglotTypeCatalog.class.getResourceAsStream(name);
        if (input == null) {
            throw new IOException("Missing embedded polyglot catalog " + name);
        }
        return input;
    }
}
