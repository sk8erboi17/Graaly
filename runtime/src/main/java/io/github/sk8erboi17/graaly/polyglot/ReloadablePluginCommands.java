package io.github.sk8erboi17.graaly.polyglot;

import org.bukkit.Server;
import org.bukkit.command.Command;
import org.bukkit.command.CommandMap;
import org.bukkit.command.PluginCommand;
import org.bukkit.command.PluginCommandYamlParser;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.PluginDescriptionFile;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/** Keeps Bukkit's command map aligned with an edited script-plugin descriptor. */
final class ReloadablePluginCommands {
    private ReloadablePluginCommands() {
    }

    static void validateReload(PluginDescriptionFile previous, PluginDescriptionFile refreshed) {
        requireUnchanged("name", previous.getName(), refreshed.getName());
        requireUnchanged("main", previous.getMain(), refreshed.getMain());
        requireUnchanged("depend", previous.getDepend(), refreshed.getDepend());
        requireUnchanged("softdepend", previous.getSoftDepend(), refreshed.getSoftDepend());
        requireUnchanged("loadbefore", previous.getLoadBefore(), refreshed.getLoadBefore());
    }

    static boolean declarationsChanged(PluginDescriptionFile previous, PluginDescriptionFile refreshed) {
        return !normalizedCommands(previous).equals(normalizedCommands(refreshed));
    }

    static int replace(Server server, Plugin plugin) {
        CommandMap commandMap = findCommandMap(server);
        Map<String, Command> knownCommands = findKnownCommands(commandMap);
        Set<Command> owned = Collections.newSetFromMap(new IdentityHashMap<Command, Boolean>());

        Iterator<Map.Entry<String, Command>> iterator = knownCommands.entrySet().iterator();
        while (iterator.hasNext()) {
            Command command = iterator.next().getValue();
            if (belongsTo(command, plugin)) {
                owned.add(command);
                iterator.remove();
            }
        }
        for (Command command : owned) {
            command.unregister(commandMap);
        }

        List<Command> replacements = PluginCommandYamlParser.parse(plugin);
        if (!replacements.isEmpty()) {
            commandMap.registerAll(plugin.getDescription().getName(), replacements);
        }
        refreshServerCommands(server);
        return replacements.size();
    }

    private static Map<String, Map<String, Object>> normalizedCommands(PluginDescriptionFile description) {
        Map<String, Map<String, Object>> commands = description.getCommands();
        return commands == null ? Collections.<String, Map<String, Object>>emptyMap() : commands;
    }

    private static void requireUnchanged(String key, Object previous, Object refreshed) {
        if (!Objects.equals(previous, refreshed)) {
            throw new IllegalArgumentException("plugin.yml field '" + key
                    + "' changed; this structural change requires a full server restart");
        }
    }

    private static boolean belongsTo(Command command, Plugin plugin) {
        return command instanceof PluginCommand
                && ((PluginCommand) command).getPlugin() == plugin;
    }

    private static CommandMap findCommandMap(Server server) {
        Object direct = invokeNoArgsIfPresent(server, "getCommandMap");
        if (direct instanceof CommandMap) {
            return (CommandMap) direct;
        }

        Object pluginManager = server.getPluginManager();
        Field field = findField(pluginManager.getClass(), "commandMap");
        if (field == null) {
            throw new IllegalStateException("The running server does not expose its Bukkit command map");
        }
        Object value = readField(field, pluginManager);
        if (!(value instanceof CommandMap)) {
            throw new IllegalStateException("The server commandMap field is not a Bukkit CommandMap");
        }
        return (CommandMap) value;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Command> findKnownCommands(CommandMap commandMap) {
        Field field = findField(commandMap.getClass(), "knownCommands");
        if (field == null) {
            throw new IllegalStateException("The running server does not expose known Bukkit commands");
        }
        Object value = readField(field, commandMap);
        if (!(value instanceof Map)) {
            throw new IllegalStateException("The knownCommands field is not a Map");
        }
        return (Map<String, Command>) value;
    }

    private static Field findField(Class<?> type, String name) {
        for (Class<?> cursor = type; cursor != null; cursor = cursor.getSuperclass()) {
            try {
                Field field = cursor.getDeclaredField(name);
                field.setAccessible(true);
                return field;
            } catch (NoSuchFieldException ignored) {
            }
        }
        return null;
    }

    private static Object readField(Field field, Object target) {
        try {
            return field.get(target);
        } catch (IllegalAccessException failure) {
            throw new IllegalStateException("Cannot read server command state", failure);
        }
    }

    private static void refreshServerCommands(Server server) {
        invokeNoArgsIfPresent(server, "syncCommands");
        Object onlinePlayers = invokeNoArgsIfPresent(server, "getOnlinePlayers");
        if (onlinePlayers instanceof Iterable) {
            for (Object player : (Iterable<?>) onlinePlayers) {
                invokeNoArgsIfPresent(player, "updateCommands");
            }
            return;
        }
        if (onlinePlayers != null && onlinePlayers.getClass().isArray()) {
            int length = Array.getLength(onlinePlayers);
            for (int index = 0; index < length; index++) {
                invokeNoArgsIfPresent(Array.get(onlinePlayers, index), "updateCommands");
            }
        }
    }

    private static Object invokeNoArgsIfPresent(Object target, String name) {
        if (target == null) {
            return null;
        }
        final Method method;
        try {
            method = target.getClass().getMethod(name);
        } catch (NoSuchMethodException ignored) {
            return null;
        }
        try {
            return method.invoke(target);
        } catch (IllegalAccessException failure) {
            throw new IllegalStateException("Cannot invoke " + name + " on " + target.getClass().getName(), failure);
        } catch (InvocationTargetException wrapped) {
            Throwable failure = wrapped.getCause();
            if (failure instanceof RuntimeException) {
                throw (RuntimeException) failure;
            }
            if (failure instanceof Error) {
                throw (Error) failure;
            }
            throw new IllegalStateException("Server command refresh failed", failure);
        }
    }
}
