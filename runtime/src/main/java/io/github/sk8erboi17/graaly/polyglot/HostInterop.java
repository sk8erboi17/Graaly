package io.github.sk8erboi17.graaly.polyglot;

import org.graalvm.polyglot.Value;

import java.lang.reflect.Array;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.HashSet;
import java.util.Set;

/** Internal conversion layer used by the language-native SDK adapters. */
final class HostInterop {
    static final String RAW_MEMBER = "__graaly_raw__";
    static final String CLASS_MEMBER = "__graaly_class__";

    private HostInterop() {
    }

    static Object unwrap(Object value) {
        if (!(value instanceof Value)) {
            return value;
        }
        Value guest = (Value) value;
        if (guest.isNull()) {
            return null;
        }
        Object marked = markedMember(guest, RAW_MEMBER);
        if (marked == null) {
            marked = markedMember(guest, CLASS_MEMBER);
        }
        if (marked != null && marked != value) {
            return unwrap(marked);
        }
        if (guest.isHostObject()) {
            return guest.asHostObject();
        }
        if (guest.isString()) {
            return guest.asString();
        }
        if (guest.isBoolean()) {
            return guest.asBoolean();
        }
        if (guest.fitsInInt()) {
            return guest.asInt();
        }
        if (guest.fitsInLong()) {
            return guest.asLong();
        }
        if (guest.fitsInBigInteger()) {
            return guest.asBigInteger();
        }
        if (guest.fitsInDouble()) {
            return guest.asDouble();
        }
        return value;
    }

    static Object[] unwrapAll(Object[] values) {
        Object[] result = new Object[values == null ? 0 : values.length];
        for (int index = 0; index < result.length; index++) {
            result[index] = unwrap(values[index]);
        }
        return result;
    }

    static Object[] packedArguments(Object packed) {
        if (packed == null) {
            return new Object[0];
        }
        if (packed instanceof Value && ((Value) packed).hasArrayElements()) {
            Value guest = (Value) packed;
            Object[] result = new Object[Math.toIntExact(guest.getArraySize())];
            for (long index = 0; index < guest.getArraySize(); index++) {
                result[Math.toIntExact(index)] = guest.getArrayElement(index);
            }
            return result;
        }
        if (packed instanceof Collection<?>) {
            return ((Collection<?>) packed).toArray();
        }
        if (packed.getClass().isArray()) {
            int length = Array.getLength(packed);
            Object[] result = new Object[length];
            for (int index = 0; index < length; index++) {
                result[index] = Array.get(packed, index);
            }
            return result;
        }
        return new Object[]{packed};
    }

    static Object construct(Object classValue, Object... arguments) {
        Object rawClass = unwrap(classValue);
        if (!(rawClass instanceof Class<?>)) {
            throw new IllegalArgumentException("Constructor target must be a Java class exported by the SDK");
        }
        Class<?> type = (Class<?>) rawClass;
        Object[] rawArguments = unwrapAll(arguments);
        Constructor<?> best = null;
        Object[] bestArguments = null;
        int bestScore = Integer.MIN_VALUE;
        for (Constructor<?> constructor : type.getConstructors()) {
            Object[] converted = convertArguments(
                    constructor.getParameterTypes(), constructor.isVarArgs(), rawArguments);
            if (converted == null) {
                continue;
            }
            int score = executableScore(constructor.getParameterTypes(), constructor.isVarArgs(), rawArguments);
            if (score > bestScore) {
                best = constructor;
                bestArguments = converted;
                bestScore = score;
            }
        }
        if (best == null) {
            throw new IllegalArgumentException("No compatible constructor found for " + type.getName()
                    + " with " + rawArguments.length + " argument(s)");
        }
        try {
            return best.newInstance(bestArguments);
        } catch (ReflectiveOperationException exception) {
            Throwable cause = invocationCause(exception);
            throw new IllegalStateException("Could not construct " + type.getName() + failureDetail(cause), cause);
        }
    }

    static Object invoke(Object targetValue, String name, Object... arguments) {
        Object target = unwrap(targetValue);
        if (target == null) {
            throw new IllegalArgumentException("Cannot call " + name + " on null");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Method name cannot be empty");
        }
        Object[] rawArguments = unwrapAll(arguments);
        Method best = null;
        Object[] bestArguments = null;
        int bestScore = Integer.MIN_VALUE;
        Class<?> inspectedType = target instanceof Class<?> ? (Class<?>) target : target.getClass();
        for (Method method : inspectedType.getMethods()) {
            if (!method.getName().equals(name)) {
                continue;
            }
            if (target instanceof Class<?> && !Modifier.isStatic(method.getModifiers())) {
                continue;
            }
            Object[] converted = convertArguments(method.getParameterTypes(), method.isVarArgs(), rawArguments);
            if (converted == null) {
                continue;
            }
            int score = executableScore(method.getParameterTypes(), method.isVarArgs(), rawArguments);
            if (score > bestScore) {
                best = method;
                bestArguments = converted;
                bestScore = score;
            }
        }
        if (best == null) {
            throw new IllegalArgumentException("No compatible " + name + " method found on " + inspectedType.getName()
                    + " for " + describe(arguments));
        }
        try {
            Object receiver = target instanceof Class<?> ? null : target;
            Method invocable = invocableMethod(inspectedType, best, receiver);
            return invocable.invoke(receiver, bestArguments);
        } catch (ReflectiveOperationException exception) {
            Throwable cause = invocationCause(exception);
            throw new IllegalStateException("Call to " + inspectedType.getName() + "." + name + " failed"
                    + failureDetail(cause), cause);
        }
    }

    static boolean hasMethod(Object targetValue, String name) {
        Object target = unwrap(targetValue);
        if (target == null || name == null) {
            return false;
        }
        Class<?> inspectedType = target instanceof Class<?> ? (Class<?>) target : target.getClass();
        for (Method method : inspectedType.getMethods()) {
            if (method.getName().equals(name)
                    && (!(target instanceof Class<?>) || Modifier.isStatic(method.getModifiers()))) {
                return true;
            }
        }
        return false;
    }

    static boolean hasStaticMember(Object classValue, String name) {
        Object rawClass = unwrap(classValue);
        if (!(rawClass instanceof Class<?>) || name == null) {
            return false;
        }
        try {
            Field field = ((Class<?>) rawClass).getField(name);
            return Modifier.isStatic(field.getModifiers());
        } catch (NoSuchFieldException ignored) {
            return nestedType((Class<?>) rawClass, name) != null;
        }
    }

    static Object staticMember(Object classValue, String name) {
        Object rawClass = unwrap(classValue);
        if (!(rawClass instanceof Class<?>)) {
            throw new IllegalArgumentException("Static member target must be a Java class exported by the SDK");
        }
        try {
            Field field = ((Class<?>) rawClass).getField(name);
            if (!Modifier.isStatic(field.getModifiers())) {
                throw new IllegalArgumentException(name + " is not static on " + ((Class<?>) rawClass).getName());
            }
            return field.get(null);
        } catch (NoSuchFieldException ignored) {
            Class<?> nested = nestedType((Class<?>) rawClass, name);
            if (nested != null) {
                return nested;
            }
            throw new IllegalArgumentException("Unknown static member " + ((Class<?>) rawClass).getName() + "." + name);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalArgumentException("Could not read static member " + ((Class<?>) rawClass).getName() + "." + name,
                    exception);
        }
    }

    static boolean isType(Object value) {
        return unwrap(value) instanceof Class<?>;
    }

    static Object property(Object targetValue, String name) {
        Object target = unwrap(targetValue);
        if (target == null) {
            throw new IllegalArgumentException("Cannot read property " + name + " on null");
        }
        if (isEnumProperty(target, name)) {
            return invoke(target, name);
        }
        String suffix = propertySuffix(name);
        for (String getter : new String[]{"get" + suffix, "is" + suffix}) {
            if (hasMethod(target, getter)) {
                try {
                    return invoke(target, getter);
                } catch (IllegalArgumentException ignored) {
                    // A same-named overload may require arguments; try the next form.
                }
            }
        }
        throw new IllegalArgumentException("Unknown readable property '" + name + "' on " + target.getClass().getName());
    }

    static boolean hasProperty(Object targetValue, String name) {
        Object target = unwrap(targetValue);
        if (target == null || name == null || name.isEmpty()) {
            return false;
        }
        if (isEnumProperty(target, name)) {
            return true;
        }
        String suffix = propertySuffix(name);
        return hasZeroArgumentMethod(target, "get" + suffix) || hasZeroArgumentMethod(target, "is" + suffix);
    }

    static void setProperty(Object targetValue, String name, Object value) {
        Object target = unwrap(targetValue);
        if (target == null) {
            throw new IllegalArgumentException("Cannot write property " + name + " on null");
        }
        invoke(target, "set" + propertySuffix(name), value);
    }

    static boolean hasWritableProperty(Object targetValue, String name) {
        Object target = unwrap(targetValue);
        return target != null && hasMethod(target, "set" + propertySuffix(name));
    }

    static boolean isCollection(Object value) {
        Object raw = unwrap(value);
        return raw != null && (raw.getClass().isArray() || raw instanceof Collection<?>);
    }

    static Object[] collectionValues(Object value) {
        Object raw = unwrap(value);
        if (raw == null) {
            return new Object[0];
        }
        if (raw.getClass().isArray()) {
            int length = Array.getLength(raw);
            Object[] result = new Object[length];
            for (int index = 0; index < length; index++) {
                result[index] = Array.get(raw, index);
            }
            return result;
        }
        if (raw instanceof Collection<?>) {
            return ((Collection<?>) raw).toArray();
        }
        throw new IllegalArgumentException("Value is not a Java collection or array");
    }

    static String collectionKind(Object value) {
        Object raw = unwrap(value);
        if (raw == null) {
            throw new IllegalArgumentException("Value is not a Java collection or array");
        }
        if (raw.getClass().isArray()) {
            return "array";
        }
        if (raw instanceof List<?>) {
            return "list";
        }
        if (raw instanceof Set<?>) {
            return "set";
        }
        if (raw instanceof Collection<?>) {
            return "collection";
        }
        throw new IllegalArgumentException("Value is not a Java collection or array");
    }

    static int collectionSize(Object value) {
        Object raw = unwrap(value);
        if (raw == null) {
            throw new IllegalArgumentException("Value is not a Java collection or array");
        }
        if (raw.getClass().isArray()) {
            return Array.getLength(raw);
        }
        if (raw instanceof Collection<?>) {
            return ((Collection<?>) raw).size();
        }
        throw new IllegalArgumentException("Value is not a Java collection or array");
    }

    static Object collectionGet(Object value, int index) {
        Object raw = unwrap(value);
        int size = collectionSize(raw);
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Collection index " + index + " outside 0.." + (size - 1));
        }
        if (raw.getClass().isArray()) {
            return Array.get(raw, index);
        }
        if (raw instanceof List<?>) {
            return ((List<?>) raw).get(index);
        }
        int current = 0;
        for (Object item : (Collection<?>) raw) {
            if (current++ == index) {
                return item;
            }
        }
        throw new IndexOutOfBoundsException("Collection index " + index + " is unavailable");
    }

    @SuppressWarnings("unchecked")
    static void collectionSet(Object value, int index, Object replacement) {
        Object raw = unwrap(value);
        int size = collectionSize(raw);
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Collection index " + index + " outside 0.." + (size - 1));
        }
        if (raw.getClass().isArray()) {
            Object converted = convert(replacement, raw.getClass().getComponentType());
            if (converted == Incompatible.VALUE) {
                throw new IllegalArgumentException("Value cannot be stored in " + raw.getClass().getTypeName());
            }
            Array.set(raw, index, converted);
            return;
        }
        if (raw instanceof List<?>) {
            ((List<Object>) raw).set(index, unwrap(replacement));
            return;
        }
        throw new UnsupportedOperationException("Indexed assignment requires a Java List or array");
    }

    @SuppressWarnings("unchecked")
    static boolean collectionAdd(Object value, Object item) {
        Object raw = unwrap(value);
        if (!(raw instanceof Collection<?>)) {
            throw new UnsupportedOperationException("A fixed Java array cannot grow");
        }
        return ((Collection<Object>) raw).add(unwrap(item));
    }

    @SuppressWarnings("unchecked")
    static void collectionInsert(Object value, int index, Object item) {
        Object raw = unwrap(value);
        if (!(raw instanceof List<?>)) {
            throw new UnsupportedOperationException("Indexed insertion requires a Java List");
        }
        int size = ((List<?>) raw).size();
        if (index < 0 || index > size) {
            throw new IndexOutOfBoundsException("Collection index " + index + " outside 0.." + size);
        }
        ((List<Object>) raw).add(index, unwrap(item));
    }

    static Object collectionRemoveAt(Object value, int index) {
        Object raw = unwrap(value);
        if (!(raw instanceof List<?>)) {
            throw new UnsupportedOperationException("Indexed removal requires a Java List");
        }
        return ((List<?>) raw).remove(index);
    }

    static boolean collectionRemoveValue(Object value, Object item) {
        Object raw = unwrap(value);
        if (!(raw instanceof Collection<?>)) {
            throw new UnsupportedOperationException("A fixed Java array cannot remove values");
        }
        return ((Collection<?>) raw).remove(unwrap(item));
    }

    static boolean collectionContains(Object value, Object item) {
        Object raw = unwrap(value);
        if (raw != null && raw.getClass().isArray()) {
            int length = Array.getLength(raw);
            Object expected = unwrap(item);
            for (int index = 0; index < length; index++) {
                Object candidate = Array.get(raw, index);
                if (candidate == null ? expected == null : candidate.equals(expected)) {
                    return true;
                }
            }
            return false;
        }
        if (raw instanceof Collection<?>) {
            return ((Collection<?>) raw).contains(unwrap(item));
        }
        throw new IllegalArgumentException("Value is not a Java collection or array");
    }

    static void collectionClear(Object value) {
        Object raw = unwrap(value);
        if (!(raw instanceof Collection<?>)) {
            throw new UnsupportedOperationException("A fixed Java array cannot be cleared");
        }
        ((Collection<?>) raw).clear();
    }

    static boolean isMap(Object value) {
        return unwrap(value) instanceof Map<?, ?>;
    }

    static Object[][] mapEntries(Object value) {
        Object raw = unwrap(value);
        if (!(raw instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Value is not a Java map");
        }
        Object[][] result = new Object[((Map<?, ?>) raw).size()][2];
        int index = 0;
        for (Map.Entry<?, ?> entry : ((Map<?, ?>) raw).entrySet()) {
            result[index][0] = entry.getKey();
            result[index][1] = entry.getValue();
            index++;
        }
        return result;
    }

    static int mapSize(Object value) {
        Object raw = unwrap(value);
        if (!(raw instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Value is not a Java map");
        }
        return ((Map<?, ?>) raw).size();
    }

    static boolean mapContainsKey(Object value, Object key) {
        Object raw = unwrap(value);
        if (!(raw instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Value is not a Java map");
        }
        return ((Map<?, ?>) raw).containsKey(unwrap(key));
    }

    static Object mapGet(Object value, Object key) {
        Object raw = unwrap(value);
        if (!(raw instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Value is not a Java map");
        }
        return ((Map<?, ?>) raw).get(unwrap(key));
    }

    @SuppressWarnings("unchecked")
    static Object mapPut(Object value, Object key, Object item) {
        Object raw = unwrap(value);
        if (!(raw instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Value is not a Java map");
        }
        return ((Map<Object, Object>) raw).put(unwrap(key), unwrap(item));
    }

    static Object mapRemove(Object value, Object key) {
        Object raw = unwrap(value);
        if (!(raw instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Value is not a Java map");
        }
        return ((Map<?, ?>) raw).remove(unwrap(key));
    }

    static void mapClear(Object value) {
        Object raw = unwrap(value);
        if (!(raw instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Value is not a Java map");
        }
        ((Map<?, ?>) raw).clear();
    }

    static boolean isOptional(Object value) {
        return unwrap(value) instanceof Optional<?>;
    }

    static Object optionalValue(Object value) {
        Object raw = unwrap(value);
        if (!(raw instanceof Optional<?>)) {
            throw new IllegalArgumentException("Value is not a java.util.Optional");
        }
        return ((Optional<?>) raw).orElse(null);
    }

    private static Object markedMember(Value guest, String memberName) {
        try {
            if (!guest.hasMembers() || !guest.hasMember(memberName)) {
                return null;
            }
            Value member = guest.getMember(memberName);
            if (member == null || member.isNull()) {
                return null;
            }
            if (member.isHostObject()) {
                return member.asHostObject();
            }
            return member;
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static boolean hasZeroArgumentMethod(Object target, String name) {
        Class<?> inspectedType = target instanceof Class<?> ? (Class<?>) target : target.getClass();
        for (Method method : inspectedType.getMethods()) {
            if (method.getName().equals(name) && method.getParameterCount() == 0
                    && (!(target instanceof Class<?>) || Modifier.isStatic(method.getModifiers()))) {
                return true;
            }
        }
        return false;
    }

    private static Class<?> nestedType(Class<?> parent, String name) {
        for (Class<?> nested : parent.getClasses()) {
            if (nested.getSimpleName().equals(name)) {
                return nested;
            }
        }
        return null;
    }

    /**
     * Returns a declaration that Java reflection can legally invoke.
     *
     * <p>Bukkit frequently returns package-private implementation classes for
     * public API interfaces (for example its {@code BiomeGrid}). Calling the
     * public method as declared by that implementation fails on modern JDKs,
     * even though the same method is part of a public interface. Prefer the
     * accessible API declaration, then fall back to opening the implementation
     * method when no public supertype declares it.</p>
     */
    private static Method invocableMethod(Class<?> inspectedType, Method selected, Object receiver) {
        if (selected.canAccess(receiver)) {
            return selected;
        }
        Method publicDeclaration = publicMethodDeclaration(
                inspectedType,
                selected.getName(),
                selected.getParameterTypes(),
                Modifier.isStatic(selected.getModifiers()),
                new HashSet<Class<?>>()
        );
        if (publicDeclaration != null && publicDeclaration.canAccess(receiver)) {
            return publicDeclaration;
        }
        selected.trySetAccessible();
        return selected;
    }

    private static Method publicMethodDeclaration(Class<?> type, String name, Class<?>[] parameterTypes,
                                                   boolean staticMethod, Set<Class<?>> visited) {
        if (type == null || !visited.add(type)) {
            return null;
        }
        if (Modifier.isPublic(type.getModifiers())) {
            try {
                Method candidate = type.getDeclaredMethod(name, parameterTypes);
                if (Modifier.isPublic(candidate.getModifiers())
                        && Modifier.isStatic(candidate.getModifiers()) == staticMethod) {
                    return candidate;
                }
            } catch (NoSuchMethodException ignored) {
                // The matching declaration may live on another public supertype.
            }
        }
        for (Class<?> interfaceType : type.getInterfaces()) {
            Method candidate = publicMethodDeclaration(
                    interfaceType, name, parameterTypes, staticMethod, visited);
            if (candidate != null) {
                return candidate;
            }
        }
        return publicMethodDeclaration(type.getSuperclass(), name, parameterTypes, staticMethod, visited);
    }

    private static boolean isEnumProperty(Object target, String name) {
        return target instanceof Enum<?> && ("name".equals(name) || "ordinal".equals(name));
    }

    private static String propertySuffix(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Property name cannot be empty");
        }
        String normalized = name.trim();
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }

    private static Object[] convertArguments(Class<?>[] parameterTypes, boolean varArgs, Object[] arguments) {
        if (!varArgs) {
            if (parameterTypes.length != arguments.length) {
                return null;
            }
            Object[] result = new Object[arguments.length];
            for (int index = 0; index < arguments.length; index++) {
                Object converted = convert(arguments[index], parameterTypes[index]);
                if (converted == Incompatible.VALUE) {
                    return null;
                }
                result[index] = converted;
            }
            return result;
        }

        int fixedCount = parameterTypes.length - 1;
        if (arguments.length < fixedCount) {
            return null;
        }
        Object[] result = new Object[parameterTypes.length];
        for (int index = 0; index < fixedCount; index++) {
            Object converted = convert(arguments[index], parameterTypes[index]);
            if (converted == Incompatible.VALUE) {
                return null;
            }
            result[index] = converted;
        }
        Class<?> componentType = parameterTypes[parameterTypes.length - 1].getComponentType();
        int variableCount = arguments.length - fixedCount;
        Object variableValues = Array.newInstance(componentType, variableCount);
        for (int index = 0; index < variableCount; index++) {
            Object converted = convert(arguments[fixedCount + index], componentType);
            if (converted == Incompatible.VALUE) {
                return null;
            }
            Array.set(variableValues, index, converted);
        }
        result[result.length - 1] = variableValues;
        return result;
    }

    private static Object convert(Object original, Class<?> targetType) {
        Object value = unwrap(original);
        if (value == null) {
            return targetType.isPrimitive() ? Incompatible.VALUE : null;
        }
        Class<?> boxed = boxed(targetType);
        if (value instanceof Number && Number.class.isAssignableFrom(boxed)) {
            return convertNumber((Number) value, boxed);
        }
        if (Number.class.isAssignableFrom(boxed)) {
            Number legacyValue = legacyNumericValue(value);
            if (legacyValue != null) {
                return convertNumber(legacyValue, boxed);
            }
        }
        if (boxed.isInstance(value)) {
            return value;
        }
        if (value instanceof Value) {
            Value guest = (Value) value;
            if (targetType.isArray() && guest.hasArrayElements()) {
                return guestArray(guest, targetType.getComponentType());
            }
            if (Collection.class.isAssignableFrom(boxed) && guest.hasArrayElements()) {
                Collection<Object> collection = newCollection(boxed);
                for (long index = 0; index < guest.getArraySize(); index++) {
                    collection.add(unwrap(guest.getArrayElement(index)));
                }
                return collection;
            }
            if (Map.class.isAssignableFrom(boxed) && guest.hasHashEntries()) {
                return guestMap(guest, boxed);
            }
            try {
                if (targetType.isInterface()) {
                    return guest.as(targetType);
                }
            } catch (RuntimeException ignored) {
                return Incompatible.VALUE;
            }
        }
        if (value instanceof Collection<?> && targetType.isArray()) {
            Collection<?> source = (Collection<?>) value;
            Object array = Array.newInstance(targetType.getComponentType(), source.size());
            int index = 0;
            for (Object element : source) {
                Object converted = convert(element, targetType.getComponentType());
                if (converted == Incompatible.VALUE) return Incompatible.VALUE;
                Array.set(array, index++, converted);
            }
            return array;
        }
        if (Collection.class.isAssignableFrom(boxed) && value.getClass().isArray()) {
            Collection<Object> collection = newCollection(boxed);
            int length = Array.getLength(value);
            for (int index = 0; index < length; index++) {
                collection.add(unwrap(Array.get(value, index)));
            }
            return collection;
        }
        if (boxed == Character.class && value instanceof String && ((String) value).length() == 1) {
            return ((String) value).charAt(0);
        }
        if (boxed.isEnum() && value instanceof String) {
            try {
                @SuppressWarnings({"rawtypes", "unchecked"})
                Object enumValue = Enum.valueOf((Class<? extends Enum>) boxed.asSubclass(Enum.class),
                        ((String) value).trim().toUpperCase(Locale.ENGLISH));
                return enumValue;
            } catch (IllegalArgumentException ignored) {
                return Incompatible.VALUE;
            }
        }
        return boxed.isAssignableFrom(value.getClass()) ? value : Incompatible.VALUE;
    }

    /**
     * Some historical API constructors accepted a byte where the canonical
     * Graaly contract now accepts a typed enum (notably MapCursor.Type). Keep
     * that compatibility conversion inside the host adapter so plugin code
     * never has to call deprecated numeric getters or branch by game version.
     */
    private static Number legacyNumericValue(Object value) {
        if (!(value instanceof Enum<?>)) {
            return null;
        }
        try {
            Method getter = value.getClass().getMethod("getValue");
            Object numeric = getter.invoke(value);
            return numeric instanceof Number ? (Number) numeric : null;
        } catch (ReflectiveOperationException | RuntimeException ignored) {
            return null;
        }
    }

    private static Object convertNumber(Number number, Class<?> boxed) {
        if (boxed == Float.class || boxed == Double.class) {
            double value = number.doubleValue();
            if (!Double.isFinite(value)) {
                return Incompatible.VALUE;
            }
            if (boxed == Double.class) {
                return preservesIntegralValue(number, value) ? value : Incompatible.VALUE;
            }
            if (Math.abs(value) > Float.MAX_VALUE) {
                return Incompatible.VALUE;
            }
            float converted = number.floatValue();
            return Float.isFinite(converted) && preservesIntegralValue(number, converted)
                    ? converted : Incompatible.VALUE;
        }

        if (boxed == Byte.class || boxed == Short.class || boxed == Integer.class || boxed == Long.class) {
            BigInteger integral = exactInteger(number);
            if (integral == null) {
                return Incompatible.VALUE;
            }
            if (boxed == Byte.class) {
                return inRange(integral, Byte.MIN_VALUE, Byte.MAX_VALUE) ? integral.byteValue() : Incompatible.VALUE;
            }
            if (boxed == Short.class) {
                return inRange(integral, Short.MIN_VALUE, Short.MAX_VALUE) ? integral.shortValue() : Incompatible.VALUE;
            }
            if (boxed == Integer.class) {
                return inRange(integral, Integer.MIN_VALUE, Integer.MAX_VALUE) ? integral.intValue() : Incompatible.VALUE;
            }
            return inRange(integral, Long.MIN_VALUE, Long.MAX_VALUE) ? integral.longValue() : Incompatible.VALUE;
        }

        return boxed.isInstance(number) ? number : Incompatible.VALUE;
    }

    /** Reject integer-to-floating conversions that silently change the value. */
    private static boolean preservesIntegralValue(Number source, double converted) {
        BigInteger integral = integralSource(source);
        if (integral == null) {
            return true;
        }
        try {
            return new BigDecimal(converted).toBigIntegerExact().equals(integral);
        } catch (NumberFormatException | ArithmeticException ignored) {
            return false;
        }
    }

    private static BigInteger integralSource(Number number) {
        if (number instanceof BigInteger) {
            return (BigInteger) number;
        }
        if (number instanceof BigDecimal) {
            try {
                return ((BigDecimal) number).toBigIntegerExact();
            } catch (ArithmeticException ignored) {
                return null;
            }
        }
        if (number instanceof Byte || number instanceof Short
                || number instanceof Integer || number instanceof Long) {
            return BigInteger.valueOf(number.longValue());
        }
        return null;
    }

    private static BigInteger exactInteger(Number number) {
        if (number instanceof BigInteger) {
            return (BigInteger) number;
        }
        if (number instanceof BigDecimal) {
            try {
                return ((BigDecimal) number).toBigIntegerExact();
            } catch (ArithmeticException ignored) {
                return null;
            }
        }
        if (number instanceof Byte || number instanceof Short
                || number instanceof Integer || number instanceof Long) {
            return BigInteger.valueOf(number.longValue());
        }
        double value = number.doubleValue();
        if (!Double.isFinite(value) || Math.rint(value) != value) {
            return null;
        }
        try {
            return BigDecimal.valueOf(value).toBigIntegerExact();
        } catch (ArithmeticException ignored) {
            return null;
        }
    }

    private static boolean inRange(BigInteger value, long minimum, long maximum) {
        return value.compareTo(BigInteger.valueOf(minimum)) >= 0
                && value.compareTo(BigInteger.valueOf(maximum)) <= 0;
    }

    static Object convertReturn(Object value, Class<?> targetType) {
        if (targetType == void.class) {
            return null;
        }
        Object converted = convert(value, targetType);
        if (converted == Incompatible.VALUE) {
            Object raw = unwrap(value);
            String actual = raw == null ? "null" : raw.getClass().getTypeName();
            throw new IllegalArgumentException("Callback returned " + actual
                    + ", which cannot be converted to " + targetType.getTypeName());
        }
        return converted;
    }

    private static Object guestArray(Value guest, Class<?> componentType) {
        Object result = Array.newInstance(componentType, Math.toIntExact(guest.getArraySize()));
        for (long index = 0; index < guest.getArraySize(); index++) {
            Object converted = convert(guest.getArrayElement(index), componentType);
            if (converted == Incompatible.VALUE) {
                return Incompatible.VALUE;
            }
            Array.set(result, Math.toIntExact(index), converted);
        }
        return result;
    }

    private static Map<Object, Object> guestMap(Value guest, Class<?> targetType) {
        Map<Object, Object> result = newMap(targetType);
        Value iterator = guest.getHashEntriesIterator();
        while (iterator.hasIteratorNextElement()) {
            Value entry = iterator.getIteratorNextElement();
            if (!entry.hasArrayElements() || entry.getArraySize() < 2) {
                continue;
            }
            result.put(unwrap(entry.getArrayElement(0)), unwrap(entry.getArrayElement(1)));
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private static Collection<Object> newCollection(Class<?> targetType) {
        if (!targetType.isInterface() && !Modifier.isAbstract(targetType.getModifiers())) {
            try {
                return (Collection<Object>) targetType.getDeclaredConstructor().newInstance();
            } catch (ReflectiveOperationException ignored) {
                // Fall through to a compatible standard collection.
            }
        }
        return Set.class.isAssignableFrom(targetType) ? new LinkedHashSet<>() : new ArrayList<>();
    }

    @SuppressWarnings("unchecked")
    private static Map<Object, Object> newMap(Class<?> targetType) {
        if (!targetType.isInterface() && !Modifier.isAbstract(targetType.getModifiers())) {
            try {
                return (Map<Object, Object>) targetType.getDeclaredConstructor().newInstance();
            } catch (ReflectiveOperationException ignored) {
                // Fall through to a deterministic insertion-ordered map.
            }
        }
        return new LinkedHashMap<>();
    }

    private static int executableScore(Class<?>[] parameterTypes, boolean varArgs, Object[] arguments) {
        int score = varArgs ? -1 : 0;
        int fixedCount = varArgs ? parameterTypes.length - 1 : parameterTypes.length;
        for (int index = 0; index < arguments.length; index++) {
            Class<?> parameter = index < fixedCount ? boxed(parameterTypes[index])
                    : boxed(parameterTypes[parameterTypes.length - 1].getComponentType());
            Object argument = unwrap(arguments[index]);
            if (argument == null) continue;
            if (parameter == argument.getClass()) score += 5;
            else if (parameter.isAssignableFrom(argument.getClass())) score += parameter == Object.class ? 1 : 4;
            else if (argument instanceof Number && Number.class.isAssignableFrom(parameter)) score += 3;
            else score += 2;
        }
        return score;
    }

    private static Class<?> boxed(Class<?> type) {
        if (!type.isPrimitive()) return type;
        if (type == boolean.class) return Boolean.class;
        if (type == byte.class) return Byte.class;
        if (type == short.class) return Short.class;
        if (type == int.class) return Integer.class;
        if (type == long.class) return Long.class;
        if (type == float.class) return Float.class;
        if (type == double.class) return Double.class;
        if (type == char.class) return Character.class;
        return type;
    }

    private static Throwable invocationCause(ReflectiveOperationException exception) {
        return exception instanceof InvocationTargetException && exception.getCause() != null
                ? exception.getCause() : exception;
    }

    private static String failureDetail(Throwable cause) {
        if (cause == null) {
            return "";
        }
        String message = cause.getMessage();
        String detail = ": " + cause.getClass().getName()
                + (message == null || message.isEmpty() ? "" : " — " + message);
        Throwable root = cause;
        for (int depth = 0; depth < 16 && root.getCause() != null && root.getCause() != root; depth++) {
            root = root.getCause();
        }
        if (root != cause) {
            String rootMessage = root.getMessage();
            detail += " (root cause: " + root.getClass().getName()
                    + (rootMessage == null || rootMessage.isEmpty() ? "" : " — " + rootMessage) + ")";
        }
        return detail;
    }

    private static String describe(Object[] values) {
        List<String> descriptions = new ArrayList<>();
        for (Object value : values) {
            if (value instanceof Value) {
                Value guest = (Value) value;
                descriptions.add("guest(array=" + guest.hasArrayElements() + ", hash=" + guest.hasHashEntries()
                        + ", host=" + guest.isHostObject() + ")");
            } else if (value == null) {
                descriptions.add("null");
            } else {
                descriptions.add(value.getClass().getName()
                        + (value.getClass().isArray() ? "[length=" + Array.getLength(value) + "]" : ""));
            }
        }
        return descriptions.toString();
    }

    private enum Incompatible {
        VALUE
    }
}
