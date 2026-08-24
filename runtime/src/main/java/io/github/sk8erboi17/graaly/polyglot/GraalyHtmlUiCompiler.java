package io.github.sk8erboi17.graaly.polyglot;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Attribute;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Compiles a deliberately small, documented HTML/CSS surface into a native Graaly UI snapshot. */
final class GraalyHtmlUiCompiler {
    private static final Gson GSON = new Gson();
    private static final int COLUMNS = 9;
    private static final int MAX_ROWS = 6;
    private static final int MAX_SOURCE_LENGTH = 256_000;
    private static final Pattern STYLE_BLOCK = Pattern.compile("(?is)<style\\b[^>]*>(.*?)</style\\s*>");
    private static final Pattern FORBIDDEN_ELEMENT = Pattern.compile(
            "(?is)<\\s*(script|iframe|object|embed|link|meta|img|audio|video|canvas|svg)\\b");
    private static final Pattern INLINE_EVENT = Pattern.compile(
            "(?is)<[^>]+\\son[a-z][a-z0-9_-]*\\s*=");
    private static final Pattern CSS_BLOCK = Pattern.compile("(?s)([^{}]+)\\{([^{}]*)}");
    private static final Pattern CSS_COMMENT = Pattern.compile("(?s)/\\*.*?\\*/");
    private static final Pattern REPEAT = Pattern.compile("(?i)repeat\\(\\s*(\\d+)\\s*,");
    private static final Set<String> CONTAINERS = Set.of(
            "div", "main", "section", "article", "header", "footer", "nav", "form", "aside");
    private static final Set<String> TEXT_ELEMENTS = Set.of(
            "span", "p", "label", "strong", "b", "em", "i", "small", "h1", "h2", "h3", "h4", "h5", "h6");
    private static final Set<String> SIMPLE_ELEMENTS = Set.of("input", "hr", "br");
    private static final Set<String> MODAL_ELEMENTS = Set.of("dialog");
    private static final Set<String> INHERITED_PROPERTIES = Set.of(
            "color", "font-weight", "font-style", "text-decoration", "text-transform");

    private static final List<Dye> DYES = List.of(
            new Dye("WHITE", 0, 0xF9FFFE, 'f', "white", "snow"),
            new Dye("ORANGE", 1, 0xF9801D, '6', "orange"),
            new Dye("MAGENTA", 2, 0xC74EBD, 'd', "magenta", "fuchsia"),
            new Dye("LIGHT_BLUE", 3, 0x3AB3DA, 'b', "lightblue", "light-blue"),
            new Dye("YELLOW", 4, 0xFED83D, 'e', "yellow"),
            new Dye("LIME", 5, 0x80C71F, 'a', "lime"),
            new Dye("PINK", 6, 0xF38BAA, 'd', "pink"),
            new Dye("GRAY", 7, 0x474F52, '8', "gray", "grey", "darkgray", "darkgrey"),
            new Dye("LIGHT_GRAY", 8, 0x9D9D97, '7', "lightgray", "lightgrey", "light-gray", "silver"),
            new Dye("CYAN", 9, 0x169C9C, '3', "cyan", "aqua", "teal"),
            new Dye("PURPLE", 10, 0x8932B8, '5', "purple", "violet"),
            new Dye("BLUE", 11, 0x3C44AA, '9', "blue", "navy"),
            new Dye("BROWN", 12, 0x835432, '6', "brown"),
            new Dye("GREEN", 13, 0x5E7C16, '2', "green", "darkgreen"),
            new Dye("RED", 14, 0xB02E26, 'c', "red", "maroon"),
            new Dye("BLACK", 15, 0x1D1D21, '0', "black")
    );
    private static final Map<String, Dye> DYE_NAMES = dyeNames();

    private GraalyHtmlUiCompiler() {
    }

    static String compile(String markup, String extraCss) {
        return GSON.toJson(compileSnapshot(markup, extraCss));
    }

    static JsonObject compileSnapshot(String markup, String extraCss) {
        String source = markup == null ? "" : markup;
        if (source.length() > MAX_SOURCE_LENGTH) {
            throw new IllegalArgumentException("HTML GUI source exceeds " + MAX_SOURCE_LENGTH + " characters");
        }
        Matcher forbidden = FORBIDDEN_ELEMENT.matcher(source);
        if (forbidden.find()) {
            throw new IllegalArgumentException("HTML GUI does not support <" + forbidden.group(1).toLowerCase(Locale.ENGLISH) + ">");
        }
        if (INLINE_EVENT.matcher(source).find()) {
            throw new IllegalArgumentException("Inline HTML event attributes are not supported; use data-action");
        }

        StringBuilder embeddedCss = new StringBuilder();
        Matcher styles = STYLE_BLOCK.matcher(source);
        StringBuffer html = new StringBuffer();
        while (styles.find()) {
            if (embeddedCss.length() > 0) embeddedCss.append('\n');
            embeddedCss.append(styles.group(1));
            styles.appendReplacement(html, "");
        }
        styles.appendTail(html);
        if (extraCss != null && !extraCss.isBlank()) {
            if (embeddedCss.length() > 0) embeddedCss.append('\n');
            embeddedCss.append(extraCss);
        }

        Node document = parseHtml(html.toString());
        Node root = document.children.size() == 1 ? document.children.get(0) : syntheticRoot(document.children);
        List<Rule> rules = parseCss(embeddedCss.toString());
        computeStyles(root, Collections.emptyMap(), rules);

        JsonObject snapshot = new JsonObject();
        snapshot.add("messages", new JsonArray());
        if (!"dialog".equals(root.tag)) {
            int rows = rows(root);
            Area canvas = new Area(0, 0, COLUMNS, rows);
            Layout layout = new Layout(rows);
            Cursor cursor = new Cursor(canvas);
            if (CONTAINERS.contains(root.tag)) {
                paintPanel(root, canvas, layout);
                for (Node child : root.children) renderNode(child, canvas, cursor, layout);
                if (root.children.isEmpty() && !root.textContent().isBlank()) paintLeaf(root, canvas, layout);
            } else {
                renderNode(root, canvas, cursor, layout);
            }

            JsonObject inventory = new JsonObject();
            inventory.addProperty("id", firstNonBlank(root.attribute("id"),
                    "html:" + Integer.toHexString(source.hashCode())));
            inventory.addProperty("title", firstNonBlank(
                    root.attribute("aria-label"), root.attribute("data-title"), root.attribute("title"), "Graaly"));
            inventory.addProperty("rows", rows);
            String closeAction = root.attribute("data-close-action");
            if (!closeAction.isBlank()) inventory.addProperty("closeActionId", closeAction);
            JsonArray items = new JsonArray();
            for (JsonObject item : layout.cells.values()) items.add(item);
            inventory.add("items", items);
            snapshot.add("inventory", inventory);
        }
        Node dialog = openDialog(root);
        if (dialog != null) snapshot.add("modal", modal(dialog));
        return snapshot;
    }

    private static Node parseHtml(String html) {
        Node document = new Node("body", Map.of(), null);
        Element body = Jsoup.parseBodyFragment(html).body();
        appendHtmlChildren(body, document);
        return document;
    }

    private static void appendHtmlChildren(Element source, Node target) {
        for (org.jsoup.nodes.Node rawChild : source.childNodes()) {
            if (rawChild instanceof TextNode) {
                target.text.append(((TextNode) rawChild).text());
                continue;
            }
            if (!(rawChild instanceof Element)) continue;
            Element element = (Element) rawChild;
            String name = element.normalName().toLowerCase(Locale.ENGLISH);
            if (!(CONTAINERS.contains(name) || TEXT_ELEMENTS.contains(name) || MODAL_ELEMENTS.contains(name)
                    || SIMPLE_ELEMENTS.contains(name) || "button".equals(name))) {
                throw new IllegalArgumentException("HTML GUI does not support <" + name + ">");
            }
            Map<String, String> attributes = new LinkedHashMap<>();
            for (Attribute attribute : element.attributes()) {
                String attributeName = attribute.getKey().toLowerCase(Locale.ENGLISH);
                if (attributeName.startsWith("on")) {
                    throw new IllegalArgumentException(
                            "Inline HTML event attributes are not supported; use data-action");
                }
                attributes.put(attributeName, attribute.getValue());
            }
            Node child = new Node(name, attributes, target);
            target.children.add(child);
            appendHtmlChildren(element, child);
        }
    }

    private static Node syntheticRoot(List<Node> children) {
        Node root = new Node("div", Map.of("id", "graaly-html-root"), null);
        for (Node child : children) {
            child.parent = root;
            root.children.add(child);
        }
        return root;
    }

    private static List<Rule> parseCss(String source) {
        String css = CSS_COMMENT.matcher(source == null ? "" : source).replaceAll("");
        List<Rule> rules = new ArrayList<>();
        Matcher blocks = CSS_BLOCK.matcher(css);
        int order = 0;
        while (blocks.find()) {
            Map<String, String> declarations = declarations(blocks.group(2));
            for (String selector : splitTopLevel(blocks.group(1), ',')) {
                String selected = selector.trim();
                if (selected.startsWith("@")) continue;
                if (!selected.isEmpty()) rules.add(new Rule(selected, declarations, order++));
            }
        }
        return rules;
    }

    private static Map<String, String> declarations(String source) {
        Map<String, String> result = new LinkedHashMap<>();
        for (String declaration : splitTopLevel(source, ';')) {
            int separator = declaration.indexOf(':');
            if (separator <= 0) continue;
            String name = declaration.substring(0, separator).trim().toLowerCase(Locale.ENGLISH);
            String value = declaration.substring(separator + 1).trim();
            if (!name.isEmpty() && !value.isEmpty()) result.put(name, value);
        }
        return result;
    }

    private static List<String> splitTopLevel(String source, char separator) {
        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int parentheses = 0;
        char quote = 0;
        for (int index = 0; index < source.length(); index++) {
            char character = source.charAt(index);
            if (quote != 0) {
                current.append(character);
                if (character == quote && (index == 0 || source.charAt(index - 1) != '\\')) quote = 0;
                continue;
            }
            if (character == '\'' || character == '"') {
                quote = character;
                current.append(character);
            } else if (character == '(') {
                parentheses++;
                current.append(character);
            } else if (character == ')') {
                parentheses = Math.max(0, parentheses - 1);
                current.append(character);
            } else if (character == separator && parentheses == 0) {
                parts.add(current.toString());
                current.setLength(0);
            } else {
                current.append(character);
            }
        }
        parts.add(current.toString());
        return parts;
    }

    private static void computeStyles(Node node, Map<String, String> parentStyle, List<Rule> rules) {
        Map<String, Candidate> candidates = new HashMap<>();
        for (Map.Entry<String, String> inherited : parentStyle.entrySet()) {
            if (INHERITED_PROPERTIES.contains(inherited.getKey()) || inherited.getKey().startsWith("--")) {
                candidates.put(inherited.getKey(), new Candidate(inherited.getValue(), -1, -1));
            }
        }
        for (Rule rule : rules) {
            if (!matchesSelector(node, rule.selector)) continue;
            int specificity = specificity(rule.selector);
            for (Map.Entry<String, String> declaration : rule.declarations.entrySet()) {
                Candidate current = candidates.get(declaration.getKey());
                if (current == null || specificity > current.specificity
                        || (specificity == current.specificity && rule.order >= current.order)) {
                    candidates.put(declaration.getKey(), new Candidate(declaration.getValue(), specificity, rule.order));
                }
            }
        }
        for (Map.Entry<String, String> declaration : declarations(node.attribute("style")).entrySet()) {
            candidates.put(declaration.getKey(), new Candidate(declaration.getValue(), 1_000, Integer.MAX_VALUE));
        }
        node.style = new LinkedHashMap<>();
        for (Map.Entry<String, Candidate> entry : candidates.entrySet()) {
            node.style.put(entry.getKey(), resolveVariables(entry.getValue().value, candidates));
        }
        for (Node child : node.children) computeStyles(child, node.style, rules);
    }

    private static String resolveVariables(String value, Map<String, Candidate> candidates) {
        String result = value;
        for (int pass = 0; pass < 8; pass++) {
            int start = result.indexOf("var(");
            if (start < 0) break;
            int end = result.indexOf(')', start + 4);
            if (end < 0) break;
            String expression = result.substring(start + 4, end);
            List<String> parts = splitTopLevel(expression, ',');
            String name = parts.get(0).trim();
            Candidate replacement = candidates.get(name);
            String selected = replacement != null ? replacement.value
                    : parts.size() > 1 ? parts.get(1).trim() : "";
            result = result.substring(0, start) + selected + result.substring(end + 1);
        }
        return result;
    }

    private static boolean matchesSelector(Node node, String selector) {
        String normalized = selector.trim().replace(">", " > ").replaceAll("\\s+", " ");
        if (normalized.isEmpty()) return false;
        List<String> parts = new ArrayList<>(Arrays.asList(normalized.split(" ")));
        int index = parts.size() - 1;
        Node current = node;
        if (!matchesSimple(current, parts.get(index--))) return false;
        while (index >= 0) {
            String token = parts.get(index--);
            boolean direct = false;
            if (">".equals(token)) {
                direct = true;
                if (index < 0) return false;
                token = parts.get(index--);
            }
            current = current.parent;
            if (direct) {
                if (current == null || !matchesSimple(current, token)) return false;
                continue;
            }
            while (current != null && !matchesSimple(current, token)) current = current.parent;
            if (current == null) return false;
        }
        return true;
    }

    private static boolean matchesSimple(Node node, String selector) {
        if (node == null) return false;
        String selected = selector.trim();
        if (selected.equals(":root")) return node.parent == null;
        if (selected.contains(":")) selected = selected.substring(0, selected.indexOf(':'));
        if (selected.isEmpty()) return true;
        Matcher token = Pattern.compile("([#.])?([A-Za-z_][A-Za-z0-9_-]*|\\*)").matcher(selected);
        int consumed = 0;
        while (token.find()) {
            if (token.start() != consumed) return false;
            consumed = token.end();
            String prefix = token.group(1);
            String value = token.group(2);
            if ("#".equals(prefix)) {
                if (!value.equals(node.attribute("id"))) return false;
            } else if (".".equals(prefix)) {
                if (!node.classes().contains(value)) return false;
            } else if (!"*".equals(value) && !value.equalsIgnoreCase(node.tag)) {
                return false;
            }
        }
        return consumed == selected.length();
    }

    private static int specificity(String selector) {
        int ids = 0;
        int classes = 0;
        int tags = 0;
        Matcher token = Pattern.compile("([#.])?([A-Za-z_][A-Za-z0-9_-]*|\\*)").matcher(selector);
        while (token.find()) {
            if ("#".equals(token.group(1))) ids++;
            else if (".".equals(token.group(1))) classes++;
            else if (!"*".equals(token.group(2)) && !"root".equals(token.group(2))) tags++;
        }
        return ids * 100 + classes * 10 + tags;
    }

    private static int rows(Node root) {
        int attributeRows = integer(firstNonBlank(root.attribute("data-rows"), root.attribute("rows")), -1);
        if (attributeRows > 0) return clamp(attributeRows, 1, MAX_ROWS);
        Matcher repeat = REPEAT.matcher(root.style.getOrDefault("grid-template-rows", ""));
        if (repeat.find()) return clamp(integer(repeat.group(1), 3), 1, MAX_ROWS);
        return 3;
    }

    private static void renderNode(Node node, Area parent, Cursor cursor, Layout layout) {
        if ("dialog".equals(node.tag)) return;
        if ("none".equalsIgnoreCase(node.style.getOrDefault("display", ""))) return;
        boolean container = CONTAINERS.contains(node.tag);
        Area explicit = area(node, parent);
        Area selected;
        if (explicit != null) {
            selected = explicit;
        } else if (container) {
            selected = parent;
        } else if ("hr".equals(node.tag)) {
            selected = cursor.nextRow(layout);
        } else {
            selected = cursor.nextCell(layout);
        }
        if (selected == null || selected.width <= 0 || selected.height <= 0) return;

        if (container) {
            if (explicit != null || hasPanelStyle(node.style)) paintPanel(node, selected, layout);
            if (node.children.isEmpty() && !node.textContent().isBlank()) {
                paintLeaf(node, selected, layout);
                return;
            }
            Cursor children = new Cursor(selected);
            for (Node child : node.children) renderNode(child, selected, children, layout);
            return;
        }
        if ("br".equals(node.tag)) return;
        paintLeaf(node, selected, layout);
    }

    private static Area area(Node node, Area parent) {
        String gridArea = node.style.getOrDefault("grid-area", "");
        if (!gridArea.isBlank()) {
            List<String> parts = splitTopLevel(gridArea, '/');
            if (parts.size() == 4) {
                GridRange rows = range(parts.get(0) + " / " + parts.get(2), parent.height);
                GridRange columns = range(parts.get(1) + " / " + parts.get(3), parent.width);
                if (rows != null && columns != null) return new Area(
                        parent.column + columns.start, parent.row + rows.start,
                        columns.length, rows.length);
            }
        }
        GridRange columns = range(firstNonBlank(node.style.get("grid-column"),
                combined(node.style.get("grid-column-start"), node.style.get("grid-column-end"))), parent.width);
        GridRange rows = range(firstNonBlank(node.style.get("grid-row"),
                combined(node.style.get("grid-row-start"), node.style.get("grid-row-end"))), parent.height);
        if (columns == null && rows == null) return null;
        if (columns == null) columns = new GridRange(0, 1);
        if (rows == null) rows = new GridRange(0, 1);
        return new Area(parent.column + columns.start, parent.row + rows.start,
                Math.min(columns.length, parent.width - columns.start),
                Math.min(rows.length, parent.height - rows.start));
    }

    private static String combined(String start, String end) {
        return start == null || start.isBlank() ? "" : start + " / " + (end == null ? "span 1" : end);
    }

    private static GridRange range(String source, int maximum) {
        if (source == null || source.isBlank() || "auto".equalsIgnoreCase(source.trim())) return null;
        List<String> parts = splitTopLevel(source, '/');
        int start = gridLine(parts.get(0), maximum + 1, 1);
        int end;
        if (parts.size() < 2) {
            end = start + 1;
        } else {
            String rawEnd = parts.get(1).trim().toLowerCase(Locale.ENGLISH);
            if (rawEnd.startsWith("span ")) end = start + integer(rawEnd.substring(5), 1);
            else end = gridLine(rawEnd, maximum + 1, start + 1);
        }
        start = clamp(start, 1, maximum) - 1;
        end = clamp(end, start + 2, maximum + 1) - 1;
        return new GridRange(start, Math.max(1, end - start));
    }

    private static int gridLine(String source, int maximum, int fallback) {
        int selected = integer(source.trim(), fallback);
        if (selected < 0) selected = maximum + selected;
        return selected;
    }

    private static void paintPanel(Node node, Area area, Layout layout) {
        Dye background = dye(firstNonBlank(node.style.get("background-color"), node.style.get("background")));
        Dye border = dye(node.style.get("border-color"));
        if (border == null) border = dye(node.style.get("border"));
        Dye top = borderSide(node, "top", border);
        Dye right = borderSide(node, "right", border);
        Dye bottom = borderSide(node, "bottom", border);
        Dye left = borderSide(node, "left", border);
        boolean rounded = positive(node.style.get("border-radius"));
        for (int row = 0; row < area.height; row++) {
            for (int column = 0; column < area.width; column++) {
                boolean corner = (row == 0 || row == area.height - 1)
                        && (column == 0 || column == area.width - 1);
                int slot = layout.slot(area.column + column, area.row + row);
                if (rounded && corner && area.width > 2 && area.height > 2) {
                    layout.cells.remove(slot);
                    continue;
                }
                Dye selected = row == 0 && top != null ? top
                        : row == area.height - 1 && bottom != null ? bottom
                        : column == 0 && left != null ? left
                        : column == area.width - 1 && right != null ? right
                        : background;
                if (selected != null) layout.cells.put(slot, decorative(slot, selected));
            }
        }
    }

    private static Dye borderSide(Node node, String side, Dye fallback) {
        String value = firstNonBlank(node.style.get("border-" + side + "-color"),
                node.style.get("border-" + side));
        if (value == null || value.isBlank()) return fallback;
        if (value.trim().toLowerCase(Locale.ENGLISH).startsWith("0") || value.contains("none")) return null;
        Dye selected = dye(value);
        return selected == null ? fallback : selected;
    }

    private static boolean hasPanelStyle(Map<String, String> style) {
        return style.keySet().stream().anyMatch(name -> name.startsWith("background")
                || name.startsWith("border"));
    }

    private static void paintLeaf(Node node, Area area, Layout layout) {
        Dye background = dye(firstNonBlank(node.style.get("background-color"), node.style.get("background")));
        if (background == null && "hr".equals(node.tag)) background = DYES.get(8);
        String customMaterial = firstNonBlank(node.attribute("data-material"), node.style.get("--minecraft-material"));
        String material = customMaterial == null || customMaterial.isBlank()
                ? background != null ? background.material()
                : "input".equals(node.tag) ? "NAME_TAG"
                : "button".equals(node.tag) ? "STONE_BUTTON" : "PAPER"
                : stripQuotes(customMaterial).trim().toUpperCase(Locale.ENGLISH);
        int durability = integer(firstNonBlank(node.attribute("data-durability"),
                node.style.get("--minecraft-durability")), background == null ? 0 : background.durability);
        int amount = clamp(integer(firstNonBlank(node.attribute("data-amount"),
                node.style.get("--minecraft-amount")), 1), 1, 64);
        String rawText = firstNonBlank(node.attribute("aria-label"), node.attribute("title"),
                "input".equals(node.tag) ? node.attribute("placeholder") : null, node.textContent(), " ");
        String name = styledText(rawText, node.style);
        String action = firstNonBlank(node.attribute("data-action"),
                "button".equals(node.tag) || "input".equals(node.tag) ? node.attribute("id") : null, "");
        JsonArray lore = lore(node);
        int namedSlot = area.row * COLUMNS + area.column + ((area.height - 1) / 2) * COLUMNS
                + ((area.width - 1) / 2);
        for (int row = 0; row < area.height; row++) {
            for (int column = 0; column < area.width; column++) {
                int slot = layout.slot(area.column + column, area.row + row);
                JsonObject item = item(slot, material, amount, durability,
                        slot == namedSlot ? name : " ", lore, action);
                if ("input".equals(node.tag)) {
                    JsonObject input = new JsonObject();
                    input.addProperty("id", firstNonBlank(node.attribute("id"), "input-" + slot));
                    input.addProperty("title", firstNonBlank(node.attribute("aria-label"),
                            node.attribute("title"), node.attribute("placeholder"), "Enter text"));
                    input.addProperty("placeholder", firstNonBlank(node.attribute("placeholder"), "Enter text"));
                    input.addProperty("value", node.attribute("value"));
                    input.addProperty("submitActionId", action);
                    input.addProperty("cancelActionId", node.attribute("data-cancel-action"));
                    item.add("input", input);
                }
                layout.cells.put(slot, item);
                layout.contentSlots.add(slot);
            }
        }
    }

    private static JsonObject decorative(int slot, Dye dye) {
        return item(slot, dye.material(), 1, dye.durability, " ", new JsonArray(), "");
    }

    private static JsonObject item(int slot, String material, int amount, int durability,
                                   String name, JsonArray lore, String action) {
        JsonObject item = new JsonObject();
        item.addProperty("slot", slot);
        item.addProperty("material", material);
        item.addProperty("amount", amount);
        item.addProperty("durability", durability);
        item.addProperty("name", name);
        item.add("lore", lore.deepCopy());
        if (action != null && !action.isBlank()) item.addProperty("actionId", action);
        return item;
    }

    private static Node openDialog(Node node) {
        if ("dialog".equals(node.tag) && (node.parent == null || node.hasAttribute("open"))) return node;
        for (Node child : node.children) {
            Node selected = openDialog(child);
            if (selected != null) return selected;
        }
        return null;
    }

    private static JsonObject modal(Node dialog) {
        List<Node> buttons = new ArrayList<>();
        collectButtons(dialog, buttons);
        if (buttons.size() != 2) {
            throw new IllegalArgumentException("An HTML <dialog> must contain exactly two <button> choices");
        }
        JsonObject modal = new JsonObject();
        modal.addProperty("id", firstNonBlank(dialog.attribute("id"),
                "dialog:" + Integer.toHexString(dialog.textContent().hashCode())));
        modal.addProperty("title", firstNonBlank(dialog.attribute("aria-label"),
                dialog.attribute("data-title"), dialog.attribute("title"), "Are you sure?"));
        modal.addProperty("closeActionId", dialog.attribute("data-close-action"));
        JsonArray choices = new JsonArray();
        choices.add(modalChoice(buttons.get(0), 0, DYES.get(5)));
        choices.add(modalChoice(buttons.get(1), 1, DYES.get(14)));
        modal.add("choices", choices);
        return modal;
    }

    private static void collectButtons(Node node, List<Node> result) {
        for (Node child : node.children) {
            if ("button".equals(child.tag)) result.add(child);
            else collectButtons(child, result);
        }
    }

    private static JsonObject modalChoice(Node button, int slot, Dye fallback) {
        Dye background = dye(firstNonBlank(button.style.get("background-color"), button.style.get("background")));
        Dye selected = background == null ? fallback : background;
        String customMaterial = firstNonBlank(button.attribute("data-material"),
                button.style.get("--minecraft-material"));
        String material = customMaterial.isBlank()
                ? selected.material() : stripQuotes(customMaterial).trim().toUpperCase(Locale.ENGLISH);
        int durability = integer(firstNonBlank(button.attribute("data-durability"),
                button.style.get("--minecraft-durability")), selected.durability);
        String action = firstNonBlank(button.attribute("data-action"), button.attribute("id"));
        if (action.isBlank()) throw new IllegalArgumentException("Each <dialog> button needs id or data-action");
        return item(slot, material, 1, durability,
                styledText(firstNonBlank(button.attribute("aria-label"), button.textContent(),
                        slot == 0 ? "Yes" : "No"), button.style), lore(button), action);
    }

    private static JsonArray lore(Node node) {
        String source = firstNonBlank(node.attribute("data-lore"), node.style.get("--minecraft-lore"));
        JsonArray lore = new JsonArray();
        if (source == null || source.isBlank()) return lore;
        String selected = stripQuotes(source).replace("\\n", "\n");
        for (String line : selected.split("[|\\n]", -1)) lore.add(styledText(line.trim(), node.style));
        return lore;
    }

    private static String styledText(String source, Map<String, String> style) {
        String text = source == null ? "" : source.trim().replaceAll("\\s+", " ");
        String transform = style.getOrDefault("text-transform", "").toLowerCase(Locale.ENGLISH);
        if ("uppercase".equals(transform)) text = text.toUpperCase(Locale.ENGLISH);
        if ("lowercase".equals(transform)) text = text.toLowerCase(Locale.ENGLISH);
        StringBuilder prefix = new StringBuilder();
        Dye color = dye(style.get("color"));
        if (color != null) prefix.append('&').append(color.chatCode);
        String weight = style.getOrDefault("font-weight", "").toLowerCase(Locale.ENGLISH);
        if ("bold".equals(weight) || integer(weight, 0) >= 600) prefix.append("&l");
        if (style.getOrDefault("font-style", "").toLowerCase(Locale.ENGLISH).contains("italic")) prefix.append("&o");
        String decoration = style.getOrDefault("text-decoration", "").toLowerCase(Locale.ENGLISH);
        if (decoration.contains("underline")) prefix.append("&n");
        if (decoration.contains("line-through")) prefix.append("&m");
        return prefix + text;
    }

    private static Dye dye(String source) {
        if (source == null || source.isBlank()) return null;
        String selected = stripQuotes(source).trim().toLowerCase(Locale.ENGLISH);
        if (selected.contains("transparent") || selected.equals("none")) return null;
        Matcher hex = Pattern.compile("#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b").matcher(selected);
        if (hex.find()) {
            String raw = hex.group(1);
            if (raw.length() == 3) raw = "" + raw.charAt(0) + raw.charAt(0)
                    + raw.charAt(1) + raw.charAt(1) + raw.charAt(2) + raw.charAt(2);
            return nearest(Integer.parseInt(raw, 16));
        }
        Matcher rgb = Pattern.compile("rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)",
                Pattern.CASE_INSENSITIVE).matcher(selected);
        if (rgb.find()) {
            int value = clamp(integer(rgb.group(1), 0), 0, 255) << 16
                    | clamp(integer(rgb.group(2), 0), 0, 255) << 8
                    | clamp(integer(rgb.group(3), 0), 0, 255);
            return nearest(value);
        }
        for (String token : selected.split("[^a-z_-]+")) {
            Dye named = DYE_NAMES.get(token);
            if (named != null) return named;
        }
        return null;
    }

    private static Dye nearest(int rgb) {
        Dye best = DYES.get(0);
        long bestDistance = Long.MAX_VALUE;
        int red = rgb >> 16 & 0xFF;
        int green = rgb >> 8 & 0xFF;
        int blue = rgb & 0xFF;
        for (Dye dye : DYES) {
            int candidateRed = dye.rgb >> 16 & 0xFF;
            int candidateGreen = dye.rgb >> 8 & 0xFF;
            int candidateBlue = dye.rgb & 0xFF;
            long distance = (long) (red - candidateRed) * (red - candidateRed)
                    + (long) (green - candidateGreen) * (green - candidateGreen)
                    + (long) (blue - candidateBlue) * (blue - candidateBlue);
            if (distance < bestDistance) {
                best = dye;
                bestDistance = distance;
            }
        }
        return best;
    }

    private static Map<String, Dye> dyeNames() {
        Map<String, Dye> names = new HashMap<>();
        for (Dye dye : DYES) for (String alias : dye.aliases) names.put(alias, dye);
        return names;
    }

    private static boolean positive(String source) {
        if (source == null || source.isBlank()) return false;
        Matcher number = Pattern.compile("-?\\d+(?:\\.\\d+)?").matcher(source);
        return number.find() && Double.parseDouble(number.group()) > 0.0D;
    }

    private static int integer(String source, int fallback) {
        if (source == null || source.isBlank()) return fallback;
        Matcher number = Pattern.compile("-?\\d+").matcher(source);
        if (!number.find()) return fallback;
        try {
            return Integer.parseInt(number.group());
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private static int clamp(int value, int minimum, int maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    private static String stripQuotes(String value) {
        String selected = value == null ? "" : value.trim();
        if (selected.length() >= 2 && ((selected.startsWith("\"") && selected.endsWith("\""))
                || (selected.startsWith("'") && selected.endsWith("'")))) {
            return selected.substring(1, selected.length() - 1);
        }
        return selected;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        return values.length == 0 ? "" : values[values.length - 1] == null ? "" : values[values.length - 1];
    }

    private static final class Node {
        private final String tag;
        private final Map<String, String> attributes;
        private final List<Node> children = new ArrayList<>();
        private final StringBuilder text = new StringBuilder();
        private Node parent;
        private Map<String, String> style = new LinkedHashMap<>();

        private Node(String tag, Map<String, String> attributes, Node parent) {
            this.tag = tag;
            this.attributes = new LinkedHashMap<>(attributes);
            this.parent = parent;
        }

        private String attribute(String name) {
            return attributes.getOrDefault(name, "");
        }

        private boolean hasAttribute(String name) {
            return attributes.containsKey(name);
        }

        private Set<String> classes() {
            String value = attribute("class").trim();
            return value.isEmpty() ? Set.of() : new LinkedHashSet<>(Arrays.asList(value.split("\\s+")));
        }

        private String textContent() {
            StringBuilder result = new StringBuilder(text);
            for (Node child : children) result.append(' ').append(child.textContent());
            return result.toString();
        }
    }

    private static final class Layout {
        private final int rows;
        private final Map<Integer, JsonObject> cells = new LinkedHashMap<>();
        private final Set<Integer> contentSlots = new LinkedHashSet<>();

        private Layout(int rows) {
            this.rows = rows;
        }

        private int slot(int column, int row) {
            if (column < 0 || column >= COLUMNS || row < 0 || row >= rows) {
                throw new IllegalArgumentException("CSS grid position is outside the 9x" + rows + " Minecraft inventory");
            }
            return row * COLUMNS + column;
        }
    }

    private static final class Cursor {
        private final Area area;
        private int offset;

        private Cursor(Area area) {
            this.area = area;
        }

        private Area nextCell(Layout layout) {
            while (offset < area.width * area.height) {
                int column = offset % area.width;
                int row = offset / area.width;
                offset++;
                int slot = layout.slot(area.column + column, area.row + row);
                if (layout.contentSlots.add(slot)) return new Area(area.column + column, area.row + row, 1, 1);
            }
            return null;
        }

        private Area nextRow(Layout layout) {
            int row = Math.min(area.height - 1, offset / Math.max(1, area.width));
            offset = Math.min(area.width * area.height, (row + 1) * area.width);
            for (int column = 0; column < area.width; column++) {
                layout.contentSlots.add(layout.slot(area.column + column, area.row + row));
            }
            return new Area(area.column, area.row + row, area.width, 1);
        }
    }

    private record Rule(String selector, Map<String, String> declarations, int order) {
    }

    private record Candidate(String value, int specificity, int order) {
    }

    private record Area(int column, int row, int width, int height) {
    }

    private record GridRange(int start, int length) {
    }

    private record Dye(String name, int durability, int rgb, char chatCode, List<String> aliases) {
        private Dye(String name, int durability, int rgb, char chatCode, String... aliases) {
            this(name, durability, rgb, chatCode, List.of(aliases));
        }

        private String material() {
            return name + "_STAINED_GLASS_PANE";
        }
    }
}
