package io.github.sk8erboi17.graaly.polyglot;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.graalvm.polyglot.Value;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Non-blocking HTTP transport used by JavaScript and Python plugins.
 * Responses are always delivered on the primary server thread so guest code
 * can safely update React roots or game state from a completion callback.
 */
public final class GraalyHttpScriptApi {
    private static final Gson GSON = new Gson();
    private static final int MAX_RESPONSE_CHARS = 4 * 1024 * 1024;
    private static final long DEFAULT_TIMEOUT_MILLIS = 15_000L;
    private static final long MAX_TIMEOUT_MILLIS = 120_000L;
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final PolyglotPlugin plugin;
    private final Map<String, CompletableFuture<?>> requests = new ConcurrentHashMap<>();
    private volatile boolean active;

    GraalyHttpScriptApi(PolyglotPlugin plugin) {
        this.plugin = plugin;
    }

    public String request(String method, String url, String headersJson, String body,
                          long timeoutMillis, Value callback) {
        if (callback == null || !callback.canExecute()) {
            throw new IllegalArgumentException("HTTP completion callback must be executable");
        }
        URI uri = URI.create(requireText(url, "HTTP URL"));
        String scheme = uri.getScheme();
        if (!("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))) {
            throw new IllegalArgumentException("Graaly HTTP only supports http:// and https:// URLs");
        }

        long selectedTimeout = timeoutMillis <= 0L ? DEFAULT_TIMEOUT_MILLIS
                : Math.min(timeoutMillis, MAX_TIMEOUT_MILLIS);
        String selectedMethod = requireText(method, "HTTP method").toUpperCase(java.util.Locale.ENGLISH);
        String selectedBody = body == null ? "" : body;
        HttpRequest.BodyPublisher publisher = selectedBody.isEmpty()
                && ("GET".equals(selectedMethod) || "HEAD".equals(selectedMethod))
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(selectedBody, StandardCharsets.UTF_8);
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofMillis(selectedTimeout))
                .method(selectedMethod, publisher);

        JsonObject headers = parseObject(headersJson, "HTTP headers");
        for (Map.Entry<String, JsonElement> entry : headers.entrySet()) {
            if (!entry.getValue().isJsonPrimitive()) {
                throw new IllegalArgumentException("HTTP header values must be strings");
            }
            builder.header(entry.getKey(), entry.getValue().getAsString());
        }

        CompletableFuture<HttpResponse<String>> future = CLIENT.sendAsync(
                builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        String requestId = UUID.randomUUID().toString();
        requests.put(requestId, future);
        future.whenComplete((response, failure) -> {
            requests.remove(requestId, future);
            if (!active || !plugin.isEnabled()) {
                return;
            }
            String payload = failure == null ? successPayload(response) : failurePayload(failure);
            plugin.getServer().getScheduler().runTask(plugin.asPlugin(), () -> {
                if (!active || !plugin.isEnabled()) {
                    return;
                }
                try {
                    plugin.invoke(callback, payload);
                } catch (Throwable throwable) {
                    plugin.getLogger().log(java.util.logging.Level.SEVERE,
                            "Could not deliver a Graaly HTTP response", throwable);
                }
            });
        });
        return requestId;
    }

    /**
     * Cancel one in-flight transport request. Guest runtimes call this from an
     * AbortSignal or coroutine cancellation handler.
     */
    public boolean cancel(String requestId) {
        if (requestId == null) {
            return false;
        }
        CompletableFuture<?> request = requests.remove(requestId);
        return request != null && request.cancel(true);
    }

    synchronized void activate() {
        active = true;
    }

    synchronized void deactivate() {
        active = false;
        for (CompletableFuture<?> request : requests.values().toArray(new CompletableFuture<?>[0])) {
            request.cancel(true);
        }
        requests.clear();
    }

    private static String successPayload(HttpResponse<String> response) {
        String responseBody = response.body() == null ? "" : response.body();
        if (responseBody.length() > MAX_RESPONSE_CHARS) {
            return errorPayload("HTTP response exceeded Graaly's 4 MiB text limit");
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", response.statusCode());
        payload.put("ok", response.statusCode() >= 200 && response.statusCode() < 300);
        payload.put("headers", response.headers().map());
        payload.put("body", responseBody);
        payload.put("error", null);
        return GSON.toJson(payload);
    }

    private static String failurePayload(Throwable failure) {
        Throwable selected = failure;
        while (selected.getCause() != null
                && (selected instanceof java.util.concurrent.CompletionException
                || selected instanceof java.util.concurrent.ExecutionException)) {
            selected = selected.getCause();
        }
        return errorPayload(selected.getClass().getSimpleName() + ": "
                + (selected.getMessage() == null ? "request failed" : selected.getMessage()));
    }

    private static String errorPayload(String message) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", 0);
        payload.put("ok", false);
        payload.put("headers", Collections.emptyMap());
        payload.put("body", "");
        payload.put("error", message);
        return GSON.toJson(payload);
    }

    private static JsonObject parseObject(String json, String description) {
        if (json == null || json.trim().isEmpty()) {
            return new JsonObject();
        }
        JsonElement element = JsonParser.parseString(json);
        if (!element.isJsonObject()) {
            throw new IllegalArgumentException(description + " must be a JSON object");
        }
        return element.getAsJsonObject();
    }

    private static String requireText(String value, String description) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(description + " cannot be empty");
        }
        return value.trim();
    }
}
