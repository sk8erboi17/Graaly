package io.github.sk8erboi17.graaly.polyglot;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

import org.bukkit.command.CommandSender;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;

final class GraalyScriptApiTest {
    @Test
    void automaticallyTranslatesAmpersandColorsForCommandSenderMessages() {
        CommandSender sender = sender();
        Object marker = new Object();
        Object[] original = {"&aEnabled&r.", marker, "plain"};

        Object[] translated = GraalyScriptApi.messageArguments(sender, "sendMessage", original);

        assertArrayEquals(new Object[]{"§aEnabled§r.", marker, "plain"}, translated);
        assertArrayEquals(new Object[]{"&aEnabled&r.", marker, "plain"}, original);
    }

    @Test
    void leavesOtherMethodsAndTargetsUntouched() {
        Object[] arguments = {"&aTitle"};

        assertSame(arguments, GraalyScriptApi.messageArguments(sender(), "sendTitle", arguments));
        assertSame(arguments, GraalyScriptApi.messageArguments(new Object(), "sendMessage", arguments));
    }

    private static CommandSender sender() {
        return (CommandSender) Proxy.newProxyInstance(
                GraalyScriptApiTest.class.getClassLoader(),
                new Class<?>[]{CommandSender.class},
                (proxy, method, arguments) -> {
                    if (method.getDeclaringClass() == Object.class) {
                        return switch (method.getName()) {
                            case "equals" -> proxy == arguments[0];
                            case "hashCode" -> System.identityHashCode(proxy);
                            default -> "GraalyScriptApiTestSender";
                        };
                    }
                    if (method.getReturnType() == boolean.class) {
                        return false;
                    }
                    return null;
                });
    }
}
