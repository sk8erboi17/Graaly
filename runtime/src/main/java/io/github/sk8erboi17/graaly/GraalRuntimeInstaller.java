package io.github.sk8erboi17.graaly;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Logger;

/** Installs the release-pinned Graal language JARs outside the Graaly plugin JAR. */
public final class GraalRuntimeInstaller {
    public static final String GRAAL_VERSION = "25.2.4";
    private static final URI MAVEN_CENTRAL = URI.create("https://repo.maven.apache.org/maven2/");

    private static final List<Artifact> JAVASCRIPT = List.of(
            artifact("org.graalvm.js", "js-language", 27_666_127L,
                    "0bf0b2523d65216aead797b6f41c0ca1f1afc22f4d74b4a3f2b42c245252ca4e")
    );

    // GraalJS and GraalPy both use the TRegex engine and shaded ICU data.
    private static final List<Artifact> SHARED = List.of(
            artifact("org.graalvm.regex", "regex", 3_905_116L,
                    "3421cdc2712efa010139b40203461346d0c1df1804d7acdf3e24ceee766b2c39"),
            artifact("org.graalvm.shadowed", "icu4j", 18_564_119L,
                    "2337312cf26f26b0d3c2eb73c155c4397944a6e4e5a6da046c9421a7b502d589")
    );

    private static final List<Artifact> PYTHON = List.of(
            artifact("org.graalvm.python", "python-language", 92_976_863L,
                    "0ae9ad00cddbb7ddb99cb92061e45ebb491f9422570905f4e9e632c6a73073a2"),
            artifact("org.graalvm.python", "python-resources", 14_430_041L,
                    "b07f6e120d61a144f359293f3aed5de29d614f0c6b404f85fb42529b3fd1494d"),
            artifact("org.graalvm.tools", "profiler-tool", 532_805L,
                    "0577e17fba50ff1909bbb032f31e2c7223008d170f5aed78fca20f8ca3d24b03"),
            artifact("org.graalvm.shadowed", "json", 181_193L,
                    "04446cf8924dee9f81442b52e437210d82c4448ec415164cc113cd41867ea38a"),
            artifact("org.graalvm.shadowed", "xz", 328_273L,
                    "47e18d6524be9e2eee5dbd947e2cc8ff74ffdc68a9f5cc2b7c461e4030bc1976")
    );

    private GraalRuntimeInstaller() {
    }

    public static InstalledRuntime install(JavaPlugin plugin) throws IOException, InterruptedException {
        plugin.saveDefaultConfig();
        FileConfiguration config = plugin.getConfig();
        boolean javascript = config.getBoolean("runtime.languages.javascript", true);
        boolean python = config.getBoolean("runtime.languages.python", true);
        boolean autoDownload = config.getBoolean("runtime.auto-download", true);
        int connectTimeout = bounded(config.getInt("runtime.connect-timeout-seconds", 20), 1, 120);
        int requestTimeout = bounded(config.getInt("runtime.request-timeout-seconds", 180), 10, 900);
        int attempts = bounded(config.getInt("runtime.retry-attempts", 2), 1, 5);

        LinkedHashSet<String> languages = new LinkedHashSet<>();
        ArrayList<Artifact> artifacts = new ArrayList<>();
        if (javascript) {
            languages.add("js");
            artifacts.addAll(JAVASCRIPT);
        }
        if (python) {
            languages.add("python");
            artifacts.addAll(PYTHON);
        }
        if (languages.isEmpty()) {
            throw new IllegalStateException(
                    "Enable at least one language in plugins/Graaly/config.yml");
        }
        artifacts.addAll(SHARED);

        Path runtimeRoot = plugin.getDataFolder().toPath()
                .resolve("runtime").resolve(GRAAL_VERSION).toAbsolutePath().normalize();
        Files.createDirectories(runtimeRoot);
        Logger logger = plugin.getLogger();
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(connectTimeout))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();

        ArrayList<Path> classpath = new ArrayList<>(artifacts.size());
        Path lockPath = runtimeRoot.getParent().resolve("install.lock");
        try (FileChannel channel = FileChannel.open(lockPath,
                StandardOpenOption.CREATE, StandardOpenOption.WRITE);
             FileLock ignored = channel.lock()) {
            for (Artifact artifact : artifacts) {
                Path target = runtimeRoot.resolve(artifact.fileName());
                if (!isVerified(target, artifact)) {
                    if (!autoDownload) {
                        throw new IllegalStateException("Missing verified " + artifact.fileName()
                                + "; enable runtime.auto-download or pre-populate " + runtimeRoot);
                    }
                    preserveInvalidFile(target);
                    download(client, artifact, target, requestTimeout, attempts, logger);
                }
                classpath.add(target);
            }
        }

        URL[] urls = new URL[classpath.size() + 1];
        URL pluginJar = plugin.getClass().getProtectionDomain().getCodeSource().getLocation();
        urls[0] = pluginJar;
        for (int index = 0; index < classpath.size(); index++) {
            urls[index + 1] = classpath.get(index).toUri().toURL();
        }
        RuntimeClassLoader classLoader = new RuntimeClassLoader(
                urls, plugin.getClass().getClassLoader());
        logger.info("Verified Graal " + String.join(" + ", languages)
                + " runtime " + GRAAL_VERSION + " in " + runtimeRoot);
        return new InstalledRuntime(classLoader,
                Collections.unmodifiableSet(new LinkedHashSet<>(languages)),
                List.copyOf(classpath), runtimeRoot);
    }

    private static Artifact artifact(String group, String name, long size, String sha256) {
        String file = name + '-' + GRAAL_VERSION + ".jar";
        String relative = group.replace('.', '/') + '/' + name + '/' + GRAAL_VERSION + '/' + file;
        return new Artifact(file, MAVEN_CENTRAL.resolve(relative), size, sha256);
    }

    private static void download(HttpClient client, Artifact artifact, Path target,
                                 int timeoutSeconds, int attempts, Logger logger)
            throws IOException, InterruptedException {
        IOException lastFailure = null;
        for (int attempt = 1; attempt <= attempts; attempt++) {
            Path temporary = target.resolveSibling(target.getFileName() + ".part-" + UUID.randomUUID());
            try {
                logger.info("Downloading " + artifact.fileName() + " (attempt " + attempt + '/' + attempts + ")");
                HttpRequest request = HttpRequest.newBuilder(artifact.uri())
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .header("User-Agent", "Graaly/1.0.0")
                        .GET()
                        .build();
                HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
                if (response.statusCode() != 200) {
                    try (InputStream ignored = response.body()) {
                        // Close the response before retrying.
                    }
                    throw new IOException("Maven Central returned HTTP " + response.statusCode()
                            + " for " + artifact.fileName());
                }
                long declared = response.headers().firstValueAsLong("content-length").orElse(-1L);
                if (declared != -1L && declared != artifact.size()) {
                    try (InputStream ignored = response.body()) {
                        // Reject unexpected content before writing it.
                    }
                    throw new IOException("Unexpected Content-Length for " + artifact.fileName());
                }
                copyExactly(response.body(), temporary, artifact.size());
                if (!isVerified(temporary, artifact)) {
                    throw new IOException("SHA-256 verification failed for " + artifact.fileName());
                }
                moveAtomically(temporary, target);
                logger.info("Installed " + artifact.fileName());
                return;
            } catch (IOException failure) {
                lastFailure = failure;
                Files.deleteIfExists(temporary);
                if (attempt < attempts) {
                    logger.warning(failure.getMessage() + "; retrying");
                }
            }
        }
        throw new IOException("Could not install " + artifact.fileName(), lastFailure);
    }

    static void copyExactly(InputStream source, Path target, long expectedSize) throws IOException {
        try (InputStream input = source;
             OutputStream output = Files.newOutputStream(target,
                     StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE)) {
            byte[] buffer = new byte[64 * 1024];
            long total = 0L;
            int read;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > expectedSize) {
                    throw new IOException("Downloaded artifact exceeds its pinned size");
                }
                output.write(buffer, 0, read);
            }
            if (total != expectedSize) {
                throw new IOException("Downloaded artifact is truncated: " + total + " of " + expectedSize);
            }
        }
    }

    static boolean isVerified(Path path, Artifact artifact) throws IOException {
        return Files.isRegularFile(path)
                && Files.size(path) == artifact.size()
                && sha256(path).equals(artifact.sha256());
    }

    private static String sha256(Path path) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream input = Files.newInputStream(path)) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    digest.update(buffer, 0, read);
                }
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    static void preserveInvalidFile(Path path) throws IOException {
        if (!Files.exists(path)) {
            return;
        }
        Path backup = path.resolveSibling(path.getFileName() + ".invalid-" + Instant.now().toEpochMilli());
        Files.move(path, backup);
    }

    private static void moveAtomically(Path source, Path target) throws IOException {
        try {
            Files.move(source, target, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException unsupported) {
            Files.move(source, target);
        }
    }

    static int bounded(int value, int minimum, int maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    record Artifact(String fileName, URI uri, long size, String sha256) {
    }

    public static final class InstalledRuntime implements AutoCloseable {
        private final RuntimeClassLoader classLoader;
        private final Set<String> languages;
        private final List<Path> classpath;
        private final Path directory;

        private InstalledRuntime(RuntimeClassLoader classLoader, Set<String> languages,
                                 List<Path> classpath, Path directory) {
            this.classLoader = classLoader;
            this.languages = languages;
            this.classpath = classpath;
            this.directory = directory;
        }

        public Set<String> languages() {
            return languages;
        }

        public List<Path> classpath() {
            return classpath;
        }

        public Path directory() {
            return directory;
        }

        public Scope activate() {
            Thread thread = Thread.currentThread();
            ClassLoader previous = thread.getContextClassLoader();
            thread.setContextClassLoader(classLoader);
            return new Scope(thread, previous);
        }

        public Class<?> loadRuntimeClass(String className) {
            try {
                return Class.forName(className, true, classLoader);
            } catch (ClassNotFoundException failure) {
                throw new IllegalStateException("Graaly runtime class is unavailable: " + className, failure);
            }
        }

        @Override
        public void close() throws IOException {
            classLoader.close();
        }
    }

    /**
     * Keeps the complete Graal stack in one loader. Truffle caches language
     * metadata by class loader, so loading its core from the plugin loader and
     * only the language providers from a child makes GraalPy's logger registry
     * see an incomplete language set. Bukkit and Graaly's bootstrap types keep
     * normal parent delegation; the runtime implementation is child-first.
     */
    private static final class RuntimeClassLoader extends URLClassLoader {
        private static final String RUNTIME_IMPLEMENTATION =
                "io.github.sk8erboi17.graaly.polyglot.";

        private RuntimeClassLoader(URL[] urls, ClassLoader parent) {
            super(urls, parent);
        }

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            if (!isChildFirst(name)) {
                return super.loadClass(name, resolve);
            }
            synchronized (getClassLoadingLock(name)) {
                Class<?> loaded = findLoadedClass(name);
                if (loaded == null) {
                    try {
                        loaded = findClass(name);
                    } catch (ClassNotFoundException missingHere) {
                        loaded = super.loadClass(name, false);
                    }
                }
                if (resolve) {
                    resolveClass(loaded);
                }
                return loaded;
            }
        }

        private static boolean isChildFirst(String name) {
            return name.startsWith(RUNTIME_IMPLEMENTATION)
                    || name.startsWith("org.graalvm.")
                    || name.startsWith("com.oracle.truffle.")
                    || name.startsWith("com.oracle.graal.")
                    || name.startsWith("com.oracle.js.");
        }
    }

    public static final class Scope implements AutoCloseable {
        private final Thread thread;
        private final ClassLoader previous;
        private boolean closed;

        private Scope(Thread thread, ClassLoader previous) {
            this.thread = thread;
            this.previous = previous;
        }

        @Override
        public void close() {
            if (!closed) {
                thread.setContextClassLoader(previous);
                closed = true;
            }
        }
    }
}
