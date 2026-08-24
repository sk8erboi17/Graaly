package io.github.sk8erboi17.graaly.polyglot;

import org.graalvm.polyglot.Value;
import org.objectweb.asm.ClassWriter;
import org.objectweb.asm.Label;
import org.objectweb.asm.Opcodes;
import org.objectweb.asm.Type;
import org.objectweb.asm.commons.GeneratorAdapter;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Modifier;
import java.lang.reflect.Proxy;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Builds native callback-backed implementations of public API extension
 * points. Guest authors provide ordinary JavaScript methods or Python
 * callables; no Java subclass syntax or host-class lookup is required.
 */
public final class ScriptObjectAdapter {
    private static final Type ADAPTER_TYPE = Type.getType(ScriptObjectAdapter.class);
    private static final Type PLUGIN_TYPE = Type.getType(PolyglotPlugin.class);
    private static final Type VALUE_TYPE = Type.getType(Value.class);
    private static final org.objectweb.asm.commons.Method HAS_HANDLER =
            new org.objectweb.asm.commons.Method("hasHandler", "(Lorg/graalvm/polyglot/Value;Ljava/lang/String;)Z");
    private static final org.objectweb.asm.commons.Method INVOKE_HANDLER =
            new org.objectweb.asm.commons.Method("invokeHandler",
                    "(Lio/github/sk8erboi17/graaly/polyglot/PolyglotPlugin;Lorg/graalvm/polyglot/Value;Ljava/lang/String;[Ljava/lang/Object;Ljava/lang/Class;)Ljava/lang/Object;");
    private static final org.objectweb.asm.commons.Method MISSING_HANDLER =
            new org.objectweb.asm.commons.Method("missingHandler",
                    "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/RuntimeException;");
    private static final AtomicInteger NEXT_ID = new AtomicInteger();
    private static final ConcurrentMap<Class<?>, Class<?>> GENERATED = new ConcurrentHashMap<>();
    private static final AdapterClassLoader LOADER = new AdapterClassLoader(ScriptObjectAdapter.class.getClassLoader());

    private ScriptObjectAdapter() {
    }

    static Object create(PolyglotPlugin plugin, Object typeValue, Value handlers, Object[] constructorArguments) {
        Object rawType = HostInterop.unwrap(typeValue);
        if (!(rawType instanceof Class<?>)) {
            throw new IllegalArgumentException("adapters.extend/extend requires an exported API type");
        }
        if (handlers == null || handlers.isNull() || (!handlers.hasMembers() && !handlers.hasHashEntries())) {
            throw new IllegalArgumentException("Extension handlers must be a JavaScript object or Python keyword methods");
        }
        handlers.pin();
        Class<?> type = (Class<?>) rawType;
        if (type.isInterface()) {
            return interfaceProxy(plugin, type, handlers);
        }
        if (Modifier.isFinal(type.getModifiers())) {
            throw new IllegalArgumentException(type.getName() + " is final and cannot be extended");
        }
        Class<?> implementation = GENERATED.computeIfAbsent(type, ScriptObjectAdapter::generateSubclass);
        Object[] requested = constructorArguments == null ? new Object[0] : constructorArguments;
        Object[] arguments = new Object[requested.length + 2];
        arguments[0] = plugin;
        arguments[1] = handlers;
        System.arraycopy(requested, 0, arguments, 2, requested.length);
        return HostInterop.construct(implementation, arguments);
    }

    public static boolean hasHandler(Value handlers, String javaName) {
        return handler(handlers, javaName) != null;
    }

    public static Object invokeHandler(PolyglotPlugin plugin, Value handlers, String javaName,
                                       Object[] arguments, Class<?> returnType) {
        Value callback = handler(handlers, javaName);
        if (callback == null) {
            throw missingHandler(handlers.toString(), javaName);
        }
        Value result = plugin.invoke(callback, arguments);
        return HostInterop.convertReturn(result, returnType);
    }

    public static RuntimeException missingHandler(String typeName, String methodName) {
        return new IllegalStateException("Missing required extension callback " + typeName + "." + methodName);
    }

    private static Object interfaceProxy(PolyglotPlugin plugin, Class<?> type, Value handlers) {
        InvocationHandler invocation = (proxy, method, arguments) -> {
            if (method.getDeclaringClass() == Object.class && !hasHandler(handlers, method.getName())) {
                switch (method.getName()) {
                    case "toString":
                        return "<Graaly " + type.getSimpleName() + " adapter>";
                    case "hashCode":
                        return System.identityHashCode(proxy);
                    case "equals":
                        return proxy == (arguments == null ? null : arguments[0]);
                    default:
                        break;
                }
            }
            if (hasHandler(handlers, method.getName())) {
                return invokeHandler(plugin, handlers, method.getName(),
                        arguments == null ? new Object[0] : arguments, method.getReturnType());
            }
            if (method.isDefault()) {
                return InvocationHandler.invokeDefault(proxy, method, arguments == null ? new Object[0] : arguments);
            }
            throw missingHandler(type.getName(), method.getName());
        };
        return Proxy.newProxyInstance(plugin.getHostClassLoader(), new Class<?>[]{type}, invocation);
    }

    private static Value handler(Value handlers, String javaName) {
        for (String candidate : new String[]{javaName, snakeCase(javaName)}) {
            try {
                if (handlers.hasMembers() && handlers.hasMember(candidate)) {
                    Value value = handlers.getMember(candidate);
                    if (value != null && value.canExecute()) {
                        return value;
                    }
                }
                if (handlers.hasHashEntries() && handlers.hasHashEntry(candidate)) {
                    Value value = handlers.getHashValue(candidate);
                    if (value != null && value.canExecute()) {
                        return value;
                    }
                }
            } catch (RuntimeException ignored) {
                // Try the next language spelling.
            }
        }
        return null;
    }

    private static String snakeCase(String value) {
        StringBuilder output = new StringBuilder(value.length() + 8);
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (Character.isUpperCase(character)) {
                if (index > 0) {
                    output.append('_');
                }
                output.append(Character.toLowerCase(character));
            } else {
                output.append(character);
            }
        }
        return output.toString();
    }

    private static Class<?> generateSubclass(Class<?> type) {
        if (!Modifier.isPublic(type.getModifiers())) {
            throw new IllegalArgumentException("Only public API classes can be extended: " + type.getName());
        }
        String binaryName = "io.github.sk8erboi17.graaly.polyglot.generated."
                + sanitize(type.getName()) + "$Graaly" + NEXT_ID.incrementAndGet();
        String internalName = binaryName.replace('.', '/');
        ClassWriter writer = new ClassWriter(ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);
        writer.visit(Opcodes.V17, Opcodes.ACC_PUBLIC | Opcodes.ACC_FINAL | Opcodes.ACC_SUPER,
                internalName, null, Type.getInternalName(type), null);
        writer.visitField(Opcodes.ACC_PRIVATE | Opcodes.ACC_FINAL, "plugin", PLUGIN_TYPE.getDescriptor(), null, null).visitEnd();
        writer.visitField(Opcodes.ACC_PRIVATE | Opcodes.ACC_FINAL, "handlers", VALUE_TYPE.getDescriptor(), null, null).visitEnd();

        int constructors = 0;
        for (Constructor<?> constructor : type.getDeclaredConstructors()) {
            int modifiers = constructor.getModifiers();
            if (!Modifier.isPublic(modifiers) && !Modifier.isProtected(modifiers)) {
                continue;
            }
            generateConstructor(writer, internalName, type, constructor);
            constructors++;
        }
        if (constructors == 0) {
            throw new IllegalArgumentException(type.getName() + " has no public or protected constructor");
        }
        for (java.lang.reflect.Method method : overridableMethods(type).values()) {
            generateOverride(writer, internalName, type, method);
        }
        writer.visitEnd();
        return LOADER.define(binaryName, writer.toByteArray());
    }

    private static void generateConstructor(ClassWriter writer, String internalName, Class<?> parent,
                                            Constructor<?> constructor) {
        Class<?>[] parameterTypes = constructor.getParameterTypes();
        Type[] original = new Type[parameterTypes.length];
        for (int index = 0; index < parameterTypes.length; index++) {
            original[index] = Type.getType(parameterTypes[index]);
        }
        Type[] generated = new Type[original.length + 2];
        generated[0] = PLUGIN_TYPE;
        generated[1] = VALUE_TYPE;
        System.arraycopy(original, 0, generated, 2, original.length);
        String[] exceptions = exceptionNames(constructor.getExceptionTypes());
        int access = Opcodes.ACC_PUBLIC | (constructor.isVarArgs() ? Opcodes.ACC_VARARGS : 0);
        GeneratorAdapter generator = new GeneratorAdapter(
                writer.visitMethod(access, "<init>", Type.getMethodDescriptor(Type.VOID_TYPE, generated), null, exceptions),
                access,
                "<init>",
                Type.getMethodDescriptor(Type.VOID_TYPE, generated)
        );
        generator.loadThis();
        for (int index = 0; index < original.length; index++) {
            generator.loadArg(index + 2);
        }
        generator.visitMethodInsn(Opcodes.INVOKESPECIAL, Type.getInternalName(parent), "<init>",
                Type.getConstructorDescriptor(constructor), false);
        generator.loadThis();
        generator.loadArg(0);
        generator.putField(Type.getObjectType(internalName), "plugin", PLUGIN_TYPE);
        generator.loadThis();
        generator.loadArg(1);
        generator.putField(Type.getObjectType(internalName), "handlers", VALUE_TYPE);
        generator.returnValue();
        generator.endMethod();
    }

    private static void generateOverride(ClassWriter writer, String internalName, Class<?> root,
                                         java.lang.reflect.Method method) {
        int methodModifiers = method.getModifiers();
        int access = (Modifier.isPublic(methodModifiers) ? Opcodes.ACC_PUBLIC : Opcodes.ACC_PROTECTED)
                | (method.isVarArgs() ? Opcodes.ACC_VARARGS : 0);
        String descriptor = Type.getMethodDescriptor(method);
        String[] exceptions = exceptionNames(method.getExceptionTypes());
        GeneratorAdapter generator = new GeneratorAdapter(
                writer.visitMethod(access, method.getName(), descriptor, null, exceptions),
                access,
                method.getName(),
                descriptor
        );
        Label fallback = generator.newLabel();
        generator.loadThis();
        generator.getField(Type.getObjectType(internalName), "handlers", VALUE_TYPE);
        generator.push(method.getName());
        generator.invokeStatic(ADAPTER_TYPE, HAS_HANDLER);
        generator.ifZCmp(GeneratorAdapter.EQ, fallback);

        generator.loadThis();
        generator.getField(Type.getObjectType(internalName), "plugin", PLUGIN_TYPE);
        generator.loadThis();
        generator.getField(Type.getObjectType(internalName), "handlers", VALUE_TYPE);
        generator.push(method.getName());
        Type[] arguments = Type.getArgumentTypes(method);
        generator.push(arguments.length);
        generator.newArray(Type.getType(Object.class));
        for (int index = 0; index < arguments.length; index++) {
            generator.dup();
            generator.push(index);
            generator.loadArg(index);
            generator.box(arguments[index]);
            generator.arrayStore(Type.getType(Object.class));
        }
        generator.push(Type.getType(method.getReturnType()));
        generator.invokeStatic(ADAPTER_TYPE, INVOKE_HANDLER);
        Type returnType = Type.getReturnType(method);
        if (returnType.equals(Type.VOID_TYPE)) {
            generator.pop();
            generator.returnValue();
        } else {
            generator.unbox(returnType);
            generator.returnValue();
        }

        generator.mark(fallback);
        if (Modifier.isAbstract(methodModifiers)) {
            generator.push(root.getName());
            generator.push(method.getName());
            generator.invokeStatic(ADAPTER_TYPE, MISSING_HANDLER);
            generator.throwException();
        } else {
            generator.loadThis();
            generator.loadArgs();
            generator.visitMethodInsn(Opcodes.INVOKESPECIAL,
                    Type.getInternalName(method.getDeclaringClass()), method.getName(), descriptor,
                    method.getDeclaringClass().isInterface());
            generator.returnValue();
        }
        generator.endMethod();
    }

    private static Map<String, java.lang.reflect.Method> overridableMethods(Class<?> type) {
        Map<String, java.lang.reflect.Method> methods = new LinkedHashMap<>();
        for (Class<?> current = type; current != null; current = current.getSuperclass()) {
            addMethods(methods, current.getDeclaredMethods());
            for (Class<?> contract : current.getInterfaces()) {
                addInterfaceMethods(methods, contract);
            }
        }
        return methods;
    }

    private static void addInterfaceMethods(Map<String, java.lang.reflect.Method> methods, Class<?> contract) {
        addMethods(methods, contract.getDeclaredMethods());
        for (Class<?> parent : contract.getInterfaces()) {
            addInterfaceMethods(methods, parent);
        }
    }

    private static void addMethods(Map<String, java.lang.reflect.Method> methods,
                                   java.lang.reflect.Method[] candidates) {
        for (java.lang.reflect.Method method : candidates) {
            int modifiers = method.getModifiers();
            if (Modifier.isStatic(modifiers) || Modifier.isFinal(modifiers) || Modifier.isPrivate(modifiers)
                    || (!Modifier.isPublic(modifiers) && !Modifier.isProtected(modifiers))) {
                continue;
            }
            String key = method.getName() + Type.getMethodDescriptor(method);
            methods.putIfAbsent(key, method);
        }
    }

    private static String[] exceptionNames(Class<?>[] types) {
        String[] names = new String[types.length];
        for (int index = 0; index < types.length; index++) {
            names[index] = Type.getInternalName(types[index]);
        }
        return names;
    }

    private static String sanitize(String name) {
        return name.replace('.', '_').replace('$', '_');
    }

    private static final class AdapterClassLoader extends ClassLoader {
        private AdapterClassLoader(ClassLoader parent) {
            super(parent);
        }

        private synchronized Class<?> define(String name, byte[] bytecode) {
            return defineClass(name, bytecode, 0, bytecode.length);
        }
    }
}
