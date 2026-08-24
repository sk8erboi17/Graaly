package io.github.sk8erboi17.graaly.polyglot;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Test
    void recognizesJavaBeanAccessorsButPreservesRealMethods() {
        CommandSender sender = sender();

        assertTrue(HostInterop.isPropertyAccessor(sender, "getName"));
        assertTrue(HostInterop.isPropertyAccessor(sender, "isOp"));
        assertTrue(HostInterop.isPropertyAccessor(sender, "setOp"));
        assertFalse(HostInterop.isPropertyAccessor(sender, "hasPermission"));
        assertFalse(HostInterop.isPropertyAccessor(sender, "sendMessage"));
    }

    @Test
    void blocksOnlyTheAccessorSignatureWhenARealOverloadSharesItsName() {
        MixedAccessors target = (MixedAccessors) Proxy.newProxyInstance(
                GraalyScriptApiTest.class.getClassLoader(),
                new Class<?>[]{MixedAccessors.class},
                (proxy, method, arguments) -> null);

        assertFalse(HostInterop.isPropertyAccessor(target, "getValue"));
        assertTrue(HostInterop.isPropertyAccessorCall(target, "getValue", 0));
        assertFalse(HostInterop.isPropertyAccessorCall(target, "getValue", 1));
        assertTrue(HostInterop.isPropertyAccessorCall(target, "setValue", 1));
        assertFalse(HostInterop.isPropertyAccessorCall(target, "setValue", 2));
    }

    private interface MixedAccessors {
        String getValue();

        String getValue(String fallback);

        void setValue(String value);

        void setValue(String value, boolean notify);
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
