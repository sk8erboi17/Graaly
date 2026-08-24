package io.github.sk8erboi17.graaly.polyglot;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.graalvm.polyglot.Value;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

/** Text/JSON-first WebSocket transport for TypeScript and Python plugins. */
public final class GraalyWebSocketScriptApi {
    private static final Gson GSON = new Gson();
    private static final int MAX_MESSAGE_CHARS = 4 * 1024 * 1024;
    private static final long DEFAULT_TIMEOUT_MILLIS = 15_000L;
    private static final long MAX_TIMEOUT_MILLIS = 120_000L;
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final PolyglotPlugin plugin;
    private final Map<String, Connection> connections = new ConcurrentHashMap<>();
    private volatile boolean active;

    GraalyWebSocketScriptApi(PolyglotPlugin plugin) {
        this.plugin = plugin;
    }

    public String open(String url, String headersJson, long timeoutMillis, Value eventCallback) {
        if (!active) {
            throw new IllegalStateException("Graaly WebSocket connections can be opened only while the plugin is enabled");
        }
        if (eventCallback == null || !eventCallback.canExecute()) {
            throw new IllegalArgumentException("WebSocket event callback must be executable");
        }
        URI uri = URI.create(requireText(url, "WebSocket URL"));
        String scheme = uri.getScheme();
        if (!("ws".equalsIgnoreCase(scheme) || "wss".equalsIgnoreCase(scheme))) {
            throw new IllegalArgumentException("Graaly WebSocket only supports ws:// and wss:// URLs");
        }

        long selectedTimeout = timeoutMillis <= 0L ? DEFAULT_TIMEOUT_MILLIS
                : Math.min(timeoutMillis, MAX_TIMEOUT_MILLIS);
        WebSocket.Builder builder = CLIENT.newWebSocketBuilder()
                .connectTimeout(Duration.ofMillis(selectedTimeout));
        JsonObject headers = parseObject(headersJson, "WebSocket headers");
        for (Map.Entry<String, JsonElement> entry : headers.entrySet()) {
            if (!entry.getValue().isJsonPrimitive()) {
                throw new IllegalArgumentException("WebSocket header values must be strings");
            }
            builder.header(entry.getKey(), entry.getValue().getAsString());
        }

        String id = UUID.randomUUID().toString();
        Connection connection = new Connection(id, eventCallback);
        connections.put(id, connection);
        CompletableFuture<WebSocket> future = builder.buildAsync(uri, connection);
        connection.connectFuture = future;
        future.whenComplete((socket, failure) -> {
            if (failure != null) {
                connection.fail(failure);
            }
        });
        return id;
    }

    public void send(String connectionId, String text, Value completionCallback) {
        Value callback = requireCallback(completionCallback, "WebSocket send callback");
        Connection connection = connections.get(requireText(connectionId, "WebSocket connection id"));
        if (connection == null || connection.socket == null) {
            deliverCompletion(callback, new IllegalStateException("WebSocket connection is not open"));
            return;
        }
        connection.socket.sendText(text == null ? "" : text, true)
                .whenComplete((ignored, failure) -> deliverCompletion(callback, failure));
    }

    public void close(String connectionId, int code, String reason, Value completionCallback) {
        Value callback = requireCallback(completionCallback, "WebSocket close callback");
        Connection connection = connections.get(requireText(connectionId, "WebSocket connection id"));
        if (connection == null || connection.socket == null) {
            deliverCompletion(callback, null);
            return;
        }
        int selectedCode = code == 0 ? WebSocket.NORMAL_CLOSURE : code;
        if (selectedCode < 1000 || selectedCode > 4999) {
            throw new IllegalArgumentException("WebSocket close code must be between 1000 and 4999");
        }
        connection.socket.sendClose(selectedCode, reason == null ? "" : reason)
                .whenComplete((ignored, failure) -> deliverCompletion(callback, failure));
    }

    public String state(String connectionId) {
        Connection connection = connections.get(connectionId);
        return connection == null ? "CLOSED" : connection.state;
    }

    synchronized void activate() {
        active = true;
    }

    synchronized void deactivate() {
        active = false;
        for (Connection connection : connections.values().toArray(new Connection[0])) {
            connection.abort();
        }
        connections.clear();
    }

    private void deliverCompletion(Value callback, Throwable failure) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (failure == null) {
            payload.put("ok", true);
        } else {
            payload.put("ok", false);
            payload.put("error", failureMessage(failure));
        }
        deliver(callback, payload, "WebSocket completion");
    }

    private void deliver(Value callback, Map<String, Object> payload, String description) {
        if (!active || !plugin.isEnabled()) {
            return;
        }
        String json = GSON.toJson(payload);
        Runnable invoke = () -> {
            if (!active || !plugin.isEnabled()) {
                return;
            }
            try {
                plugin.invoke(callback, json);
            } catch (Throwable throwable) {
                plugin.getLogger().log(Level.SEVERE, "Could not deliver a Graaly " + description, throwable);
            }
        };
        if (plugin.getServer().isPrimaryThread()) {
            invoke.run();
        } else {
            plugin.getServer().getScheduler().runTask(plugin.asPlugin(), invoke);
        }
    }

    private static Value requireCallback(Value callback, String description) {
        if (callback == null || !callback.canExecute()) {
            throw new IllegalArgumentException(description + " must be executable");
        }
        return callback;
    }

    private static String requireText(String value, String description) {
        String selected = value == null ? "" : value.trim();
        if (selected.isEmpty()) {
            throw new IllegalArgumentException(description + " cannot be empty");
        }
        return selected;
    }

    private static JsonObject parseObject(String json, String description) {
        JsonElement parsed = JsonParser.parseString(json == null || json.isEmpty() ? "{}" : json);
        if (!parsed.isJsonObject()) {
            throw new IllegalArgumentException(description + " must be a JSON object");
        }
        return parsed.getAsJsonObject();
    }

    private static String failureMessage(Throwable failure) {
        Throwable selected = failure;
        while ((selected instanceof CompletionException) && selected.getCause() != null) {
            selected = selected.getCause();
        }
        String message = selected.getMessage();
        return message == null || message.isEmpty() ? selected.getClass().getSimpleName() : message;
    }

    private final class Connection implements WebSocket.Listener {
        private final String id;
        private final Value callback;
        private final StringBuilder text = new StringBuilder();
        private volatile WebSocket socket;
        private volatile CompletableFuture<WebSocket> connectFuture;
        private volatile String state = "CONNECTING";
        private boolean failed;

        private Connection(String id, Value callback) {
            this.id = id;
            this.callback = callback;
        }

        @Override
        public void onOpen(WebSocket selected) {
            socket = selected;
            state = "OPEN";
            selected.request(1);
            event("open", Map.of());
        }

        @Override
        public CompletionStage<?> onText(WebSocket selected, CharSequence data, boolean last) {
            text.append(data);
            if (text.length() > MAX_MESSAGE_CHARS) {
                selected.abort();
                fail(new IllegalStateException("WebSocket message exceeded Graaly's 4 MiB text limit"));
                return CompletableFuture.completedFuture(null);
            }
            if (last) {
                String message = text.toString();
                text.setLength(0);
                event("message", Map.of("data", message));
            }
            selected.request(1);
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletionStage<?> onBinary(WebSocket selected, ByteBuffer data, boolean last) {
            byte[] bytes = new byte[data.remaining()];
            data.get(bytes);
            event("binary", Map.of("data", Base64.getEncoder().encodeToString(bytes), "last", last));
            selected.request(1);
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletionStage<?> onPing(WebSocket selected, ByteBuffer message) {
            selected.request(1);
            return selected.sendPong(message);
        }

        @Override
        public CompletionStage<?> onPong(WebSocket selected, ByteBuffer message) {
            selected.request(1);
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletionStage<?> onClose(WebSocket selected, int statusCode, String reason) {
            state = "CLOSED";
            connections.remove(id, this);
            event("close", Map.of("code", statusCode, "reason", reason == null ? "" : reason));
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public void onError(WebSocket selected, Throwable failure) {
            fail(failure);
        }

        private synchronized void fail(Throwable failure) {
            if (failed || "CLOSED".equals(state)) {
                return;
            }
            failed = true;
            state = "CLOSED";
            connections.remove(id, this);
            event("error", Map.of("error", failureMessage(failure)));
        }

        private void event(String type, Map<String, ?> values) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", type);
            payload.put("connectionId", id);
            payload.putAll(values);
            deliver(callback, payload, "WebSocket event");
        }

        private void abort() {
            state = "CLOSED";
            CompletableFuture<WebSocket> pending = connectFuture;
            if (pending != null) {
                pending.cancel(true);
            }
            WebSocket selected = socket;
            if (selected != null) {
                selected.abort();
            }
        }
    }
}
