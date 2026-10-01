package io.github.sk8erboi17.graaly.polyglot;

import com.google.gson.*;
import java.nio.file.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;

/** Fixture producer calls the native compiler and records independently parsed DOM nodes. */
public class AcademyHtmlConformance {
    private static JsonElement tree(Node node) {
        JsonObject result = new JsonObject();
        if (node instanceof TextNode text) {
            result.addProperty("text", text.getWholeText());
        } else if (node instanceof Element element) {
            result.addProperty("tag", element.tagName());
            JsonObject attributes = new JsonObject();
            element.attributes().forEach(attribute -> attributes.addProperty(attribute.getKey(), attribute.getValue()));
            result.add("attributes", attributes);
            JsonArray children = new JsonArray();
            for (Node child : element.childNodes()) if (child instanceof Element || child instanceof TextNode) children.add(tree(child));
            result.add("children", children);
        }
        return result;
    }
    public static void main(String[] args) throws Exception {
        JsonArray fixtures = JsonParser.parseString(Files.readString(Path.of(args[0]))).getAsJsonArray();
        for (JsonElement entry : fixtures) {
            JsonObject fixture = entry.getAsJsonObject();
            String source = fixture.get("source").getAsString();
            try {
                fixture.add("snapshot", GraalyHtmlUiCompiler.compileSnapshot(source, ""));
            } catch (Exception error) {
                fixture.addProperty("error", error.getMessage());
            }
            String inert = source.replaceAll("(?is)<style\\b[^>]*>(.*?)</style\\s*>", "");
            fixture.add("body", tree(Jsoup.parse(inert).body()));
        }
        Files.writeString(Path.of(args[1]), new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(fixtures) + "\n");
    }
}
