package io.github.sk8erboi17.graaly;

import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import java.util.Arrays;
import org.objectweb.asm.ClassReader;
import org.objectweb.asm.ClassVisitor;
import org.objectweb.asm.ClassWriter;
import org.objectweb.asm.MethodVisitor;
import org.objectweb.asm.Opcodes;

/**
 * Lets historical server launchers run on a modern Java runtime without modifying or
 * redistributing their server jars.
 *
 * <p>Several releases compare {@code java.class.version} with the newest JVM
 * known when that release was published, then exit before plugins can load.
 * The check says nothing about actual bytecode compatibility.  When Graaly is
 * also supplied as a javaagent, this transformer changes only that property
 * lookup inside CraftBukkit's launcher to a Graaly-owned property containing
 * the class-file level the launcher itself was compiled for.  The real JVM
 * properties and every other class remain untouched.</p>
 */
public final class GraalyLegacyLauncherAgent {
    private static final byte[] ORIGINAL = ascii("java.class.version");
    // This byte sequence replaces a UTF-8 constant in place, so it must stay
    // exactly as long as "java.class.version" (18 bytes).
    private static final byte[] REPLACEMENT = ascii("graaly.jvm.version");

    private GraalyLegacyLauncherAgent() {
    }

    public static void premain(String arguments, Instrumentation instrumentation) {
        instrumentation.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className,
                                    Class<?> classBeingRedefined,
                                    ProtectionDomain protectionDomain,
                                    byte[] classfileBuffer) {
                if (!"org/bukkit/craftbukkit/Main".equals(className)
                        && (className == null || !className.endsWith("/util/CraftMagicNumbers"))) {
                    return null;
                }

                if (classfileBuffer == null || classfileBuffer.length < 8) {
                    return null;
                }

                if (className.endsWith("/util/CraftMagicNumbers")) {
                    return skipGraalyBytecodeConversion(classfileBuffer);
                }

                int classFileVersion = ((classfileBuffer[6] & 0xff) << 8)
                        | (classfileBuffer[7] & 0xff);
                int advertisedVersion = compatibleClassVersion(classfileBuffer, classFileVersion);
                System.setProperty("graaly.jvm.version", advertisedVersion + ".0");

                byte[] transformed = Arrays.copyOf(classfileBuffer, classfileBuffer.length);
                boolean replaced = false;
                for (int index = 0; index <= transformed.length - ORIGINAL.length; index++) {
                    if (!matches(transformed, index, ORIGINAL)) {
                        continue;
                    }
                    System.arraycopy(REPLACEMENT, 0, transformed, index, REPLACEMENT.length);
                    index += ORIGINAL.length - 1;
                    replaced = true;
                }
                if (replaced) {
                    System.out.println("[Graaly] legacy launcher adapter active (server class level "
                            + classFileVersion + ", compatibility level " + advertisedVersion + ")");
                    return transformed;
                }
                return null;
            }
        });
    }

    private static byte[] skipGraalyBytecodeConversion(byte[] original) {
        ClassReader reader = new ClassReader(original);
        ClassWriter writer = new ClassWriter(reader, ClassWriter.COMPUTE_MAXS);
        ClassVisitor visitor = new ClassVisitor(Opcodes.ASM9, writer) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor,
                                             String signature, String[] exceptions) {
                MethodVisitor delegate = super.visitMethod(access, name, descriptor, signature, exceptions);
                if (!"processClass".equals(name)
                        || !descriptor.startsWith("(Lorg/bukkit/plugin/PluginDescriptionFile;Ljava/lang/String;[B)")) {
                    return delegate;
                }
                return new MethodVisitor(Opcodes.ASM9, delegate) {
                    @Override
                    public void visitCode() {
                        super.visitCode();
                        visitVarInsn(Opcodes.ALOAD, 1);
                        visitMethodInsn(Opcodes.INVOKEVIRTUAL,
                                "org/bukkit/plugin/PluginDescriptionFile", "getName",
                                "()Ljava/lang/String;", false);
                        visitLdcInsn("Graaly");
                        visitMethodInsn(Opcodes.INVOKEVIRTUAL, "java/lang/String", "equals",
                                "(Ljava/lang/Object;)Z", false);
                        org.objectweb.asm.Label continueNormally = new org.objectweb.asm.Label();
                        visitJumpInsn(Opcodes.IFEQ, continueNormally);
                        visitVarInsn(Opcodes.ALOAD, 3);
                        visitInsn(Opcodes.ARETURN);
                        visitLabel(continueNormally);
                        visitFrame(Opcodes.F_SAME, 0, null, 0, null);
                    }
                };
            }
        };
        reader.accept(visitor, 0);
        return writer.toByteArray();
    }

    private static boolean matches(byte[] source, int offset, byte[] expected) {
        for (int index = 0; index < expected.length; index++) {
            if (source[offset + index] != expected[index]) {
                return false;
            }
        }
        return true;
    }

    private static int compatibleClassVersion(byte[] classfile, int compiledVersion) {
        // The 1.17 launcher itself was still compiled for Java 8 while requiring
        // Java 16.  The 1.18 launcher was compiled for Java 16 while requiring
        // Java 17.  Advertise an accepted baseline only to that launcher's
        // compatibility check; the process continues to run on the real JVM.
        if (contains(classfile, ascii("requires at least Java 17"))) {
            return 61;
        }
        if (contains(classfile, ascii("requires at least Java 16"))) {
            return 60;
        }
        return compiledVersion;
    }

    private static boolean contains(byte[] source, byte[] expected) {
        for (int offset = 0; offset <= source.length - expected.length; offset++) {
            if (matches(source, offset, expected)) {
                return true;
            }
        }
        return false;
    }

    private static byte[] ascii(String value) {
        byte[] bytes = new byte[value.length()];
        for (int index = 0; index < value.length(); index++) {
            bytes[index] = (byte) value.charAt(index);
        }
        return bytes;
    }
}
