package io.github.sk8erboi17.graaly.polyglot;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.bukkit.Server;
import org.bukkit.command.Command;
import org.bukkit.command.PluginCommand;
import org.bukkit.command.PluginCommandYamlParser;
import org.bukkit.command.SimpleCommandMap;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.PluginDescriptionFile;
import org.bukkit.plugin.SimplePluginManager;
import org.junit.jupiter.api.Test;

import java.io.StringReader;
import java.lang.reflect.Proxy;
import java.util.logging.Logger;

final class ReloadablePluginCommandsTest {
    @Test
    void replacesAddedRemovedAndEditedCommandDeclarations() throws Exception {
        Harness harness = new Harness();
        DescriptionHolder holder = new DescriptionHolder(description("""
                name: HotCommands
                version: 1.0.0
                main: main.mjs
                commands:
                  old:
                    aliases: [legacy]
                  fly:
                    description: Old description
                """));
        Plugin plugin = plugin(holder, harness.server);
        harness.commandMap.registerAll(holder.value.getName(), PluginCommandYamlParser.parse(plugin));

        assertOwned(harness.commandMap.getCommand("old"), plugin);
        assertOwned(harness.commandMap.getCommand("legacy"), plugin);
        assertOwned(harness.commandMap.getCommand("hotcommands:old"), plugin);

        PluginDescriptionFile refreshed = description("""
                name: HotCommands
                version: 1.0.1
                main: main.mjs
                commands:
                  fly:
                    description: Toggle flight
                    usage: /fly [player]
                    aliases: [flight]
                  heal:
                    description: Restore health
                """);
        assertTrue(ReloadablePluginCommands.declarationsChanged(holder.value, refreshed));
        ReloadablePluginCommands.validateReload(holder.value, refreshed);
        holder.value = refreshed;

        assertEquals(2, ReloadablePluginCommands.replace(harness.server, plugin));

        assertNull(harness.commandMap.getCommand("old"));
        assertNull(harness.commandMap.getCommand("legacy"));
        assertNull(harness.commandMap.getCommand("hotcommands:old"));

        PluginCommand fly = assertOwned(harness.commandMap.getCommand("fly"), plugin);
        assertEquals("Toggle flight", fly.getDescription());
        assertEquals("/fly [player]", fly.getUsage());
        assertSame(fly, harness.commandMap.getCommand("flight"));
        assertOwned(harness.commandMap.getCommand("heal"), plugin);
        assertOwned(harness.commandMap.getCommand("hotcommands:heal"), plugin);
        assertFalse(ReloadablePluginCommands.declarationsChanged(refreshed, refreshed));
    }

    @Test
    void rejectsStructuralDescriptorChangesThatNeedAFullRestart() throws Exception {
        PluginDescriptionFile original = description("""
                name: StableName
                version: 1.0.0
                main: main.mjs
                """);
        PluginDescriptionFile renamed = description("""
                name: Renamed
                version: 1.0.0
                main: main.mjs
                """);
        PluginDescriptionFile movedEntry = description("""
                name: StableName
                version: 1.0.0
                main: dist/other.mjs
                """);

        IllegalArgumentException nameFailure = assertThrows(IllegalArgumentException.class,
                () -> ReloadablePluginCommands.validateReload(original, renamed));
        assertTrue(nameFailure.getMessage().contains("'name'"));

        IllegalArgumentException mainFailure = assertThrows(IllegalArgumentException.class,
                () -> ReloadablePluginCommands.validateReload(original, movedEntry));
        assertTrue(mainFailure.getMessage().contains("'main'"));
    }

    private static PluginCommand assertOwned(Command command, Plugin plugin) {
        assertTrue(command instanceof PluginCommand);
        PluginCommand pluginCommand = (PluginCommand) command;
        assertSame(plugin, pluginCommand.getPlugin());
        return pluginCommand;
    }

    private static PluginDescriptionFile description(String yaml) throws Exception {
        return new PluginDescriptionFile(new StringReader(yaml));
    }

    private static Plugin plugin(DescriptionHolder holder, Server server) {
        return (Plugin) Proxy.newProxyInstance(
                ReloadablePluginCommandsTest.class.getClassLoader(),
                new Class<?>[]{Plugin.class},
                (proxy, method, arguments) -> {
                    if (method.getDeclaringClass() == Object.class) {
                        if (method.getName().equals("equals")) {
                            return proxy == arguments[0];
                        }
                        if (method.getName().equals("hashCode")) {
                            return System.identityHashCode(proxy);
                        }
                        return holder.value.getFullName();
                    }
                    return switch (method.getName()) {
                        case "getDescription" -> holder.value;
                        case "getName" -> holder.value.getName();
                        case "getServer" -> server;
                        case "getLogger" -> Logger.getLogger(holder.value.getName());
                        case "isEnabled" -> true;
                        case "onCommand" -> false;
                        default -> defaultValue(method.getReturnType());
                    };
                });
    }

    private static Object defaultValue(Class<?> type) {
        if (!type.isPrimitive()) {
            return null;
        }
        if (type == boolean.class) {
            return false;
        }
        if (type == char.class) {
            return '\0';
        }
        if (type == byte.class) {
            return (byte) 0;
        }
        if (type == short.class) {
            return (short) 0;
        }
        if (type == int.class) {
            return 0;
        }
        if (type == long.class) {
            return 0L;
        }
        if (type == float.class) {
            return 0F;
        }
        return 0D;
    }

    private static final class DescriptionHolder {
        private PluginDescriptionFile value;

        private DescriptionHolder(PluginDescriptionFile value) {
            this.value = value;
        }
    }

    private static final class Harness {
        private final Server server;
        private final SimpleCommandMap commandMap;
        private SimplePluginManager pluginManager;

        private Harness() {
            server = (Server) Proxy.newProxyInstance(
                    ReloadablePluginCommandsTest.class.getClassLoader(),
                    new Class<?>[]{Server.class},
                    (proxy, method, arguments) -> {
                        if (method.getDeclaringClass() == Object.class) {
                            if (method.getName().equals("equals")) {
                                return proxy == arguments[0];
                            }
                            if (method.getName().equals("hashCode")) {
                                return System.identityHashCode(proxy);
                            }
                            return "ReloadablePluginCommandsTestServer";
                        }
                        return switch (method.getName()) {
                            case "getPluginManager" -> pluginManager;
                            case "getLogger" -> Logger.getLogger("ReloadablePluginCommandsTest");
                            case "isPrimaryThread" -> true;
                            default -> defaultValue(method.getReturnType());
                        };
                    });
            commandMap = new SimpleCommandMap(server);
            pluginManager = new SimplePluginManager(server, commandMap);
        }
    }
}
