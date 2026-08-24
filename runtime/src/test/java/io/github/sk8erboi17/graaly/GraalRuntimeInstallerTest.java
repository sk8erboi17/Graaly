package io.github.sk8erboi17.graaly;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

final class GraalRuntimeInstallerTest {
    @Test
    void downloadPlanIsPinnedToMavenCentralAndOneRelease() throws Exception {
        List<Object> artifacts = new ArrayList<>();
        artifacts.addAll(artifactList("JAVASCRIPT"));
        artifacts.addAll(artifactList("PYTHON"));
        artifacts.addAll(artifactList("SHARED"));

        assertEquals(8, artifacts.size());
        Set<String> names = new HashSet<>();
        for (Object artifact : artifacts) {
            Class<?> type = artifact.getClass();
            String fileName = (String) accessor(type, "fileName").invoke(artifact);
            URI uri = (URI) accessor(type, "uri").invoke(artifact);
            long size = (Long) accessor(type, "size").invoke(artifact);
            String sha256 = (String) accessor(type, "sha256").invoke(artifact);

            assertTrue(names.add(fileName), "duplicate artifact " + fileName);
            assertTrue(fileName.endsWith('-' + GraalRuntimeInstaller.GRAAL_VERSION + ".jar"));
            assertEquals("https", uri.getScheme());
            assertEquals("repo.maven.apache.org", uri.getHost());
            assertTrue(uri.getPath().endsWith('/' + fileName));
            assertTrue(size > 100_000L);
            assertTrue(sha256.matches("[0-9a-f]{64}"));
        }
    }

    @Test
    void defaultConfigIsSmallAndEnablesVerifiedFirstStartDownloads() throws Exception {
        try (InputStream input = GraalRuntimeInstaller.class.getClassLoader()
                .getResourceAsStream("config.yml")) {
            assertNotNull(input);
            String config = new String(input.readAllBytes(), StandardCharsets.UTF_8);
            assertTrue(config.contains("auto-download: true"));
            assertTrue(config.contains("javascript: true"));
            assertTrue(config.contains("python: true"));
            assertTrue(config.lines().count() <= 12, "keep the generated administrator config small");
        }
    }

    @Test
    void legacyAgentConstantPoolReplacementKeepsItsExactLength() throws Exception {
        Field original = GraalyLegacyLauncherAgent.class.getDeclaredField("ORIGINAL");
        Field replacement = GraalyLegacyLauncherAgent.class.getDeclaredField("REPLACEMENT");
        original.setAccessible(true);
        replacement.setAccessible(true);
        assertEquals(((byte[]) original.get(null)).length, ((byte[]) replacement.get(null)).length);
        assertEquals(18, ((byte[]) replacement.get(null)).length);
    }

    @Test
    void verifiesBothPinnedSizeAndSha256(@TempDir Path directory) throws Exception {
        byte[] expected = "graaly".getBytes(StandardCharsets.UTF_8);
        GraalRuntimeInstaller.Artifact artifact = new GraalRuntimeInstaller.Artifact(
                "fixture.jar", URI.create("https://repo.maven.apache.org/fixture.jar"),
                expected.length, sha256(expected));
        Path target = directory.resolve(artifact.fileName());

        Files.write(target, expected);
        assertTrue(GraalRuntimeInstaller.isVerified(target, artifact));

        Files.writeString(target, "Graalm", StandardCharsets.UTF_8);
        assertFalse(GraalRuntimeInstaller.isVerified(target, artifact),
                "same-size content with the wrong digest must be rejected");

        Files.writeString(target, "short", StandardCharsets.UTF_8);
        assertFalse(GraalRuntimeInstaller.isVerified(target, artifact),
                "a truncated artifact must be rejected before hashing");
    }

    @Test
    void exactCopyRejectsTruncatedAndOversizedBodies(@TempDir Path directory) throws Exception {
        Path exact = directory.resolve("exact.part");
        GraalRuntimeInstaller.copyExactly(
                new ByteArrayInputStream(new byte[]{1, 2}), exact, 2);
        assertEquals(2, Files.size(exact));

        IOException truncated = assertThrows(IOException.class, () ->
                GraalRuntimeInstaller.copyExactly(
                        new ByteArrayInputStream(new byte[]{1}), directory.resolve("short.part"), 2));
        assertTrue(truncated.getMessage().contains("truncated"));

        IOException oversized = assertThrows(IOException.class, () ->
                GraalRuntimeInstaller.copyExactly(
                        new ByteArrayInputStream(new byte[]{1, 2}), directory.resolve("large.part"), 1));
        assertTrue(oversized.getMessage().contains("exceeds"));
    }

    @Test
    void corruptCacheEntryIsQuarantinedInsteadOfOverwritten(@TempDir Path directory) throws Exception {
        Path target = directory.resolve("runtime.jar");
        Files.writeString(target, "corrupt", StandardCharsets.UTF_8);

        GraalRuntimeInstaller.preserveInvalidFile(target);

        assertFalse(Files.exists(target));
        List<Path> quarantined;
        try (var entries = Files.list(directory)) {
            quarantined = entries.toList();
        }
        assertEquals(1, quarantined.size());
        assertTrue(quarantined.get(0).getFileName().toString()
                .startsWith("runtime.jar.invalid-"));
        assertEquals("corrupt", Files.readString(quarantined.get(0), StandardCharsets.UTF_8));
    }

    @Test
    void configurationBoundsRejectExtremeOperationalValues() {
        assertEquals(1, GraalRuntimeInstaller.bounded(-100, 1, 120));
        assertEquals(20, GraalRuntimeInstaller.bounded(20, 1, 120));
        assertEquals(120, GraalRuntimeInstaller.bounded(10_000, 1, 120));
    }

    private static List<?> artifactList(String fieldName) throws Exception {
        Field field = GraalRuntimeInstaller.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        return (List<?>) field.get(null);
    }

    private static Method accessor(Class<?> type, String name) throws Exception {
        Method method = type.getDeclaredMethod(name);
        method.setAccessible(true);
        return method;
    }

    private static String sha256(byte[] value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value));
    }
}
