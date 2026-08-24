package io.github.sk8erboi17.graaly.polyglot;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GraalyHtmlUiCompilerTest {
    @Test
    void compilesSemanticHtmlCssIntoNativeInventoryItems() {
        JsonObject snapshot = GraalyHtmlUiCompiler.compileSnapshot("""
                <div id="shop" aria-label="Negozio">
                  <style>
                    #shop {
                      display: grid;
                      grid-template-columns: repeat(9, 1fr);
                      grid-template-rows: repeat(3, 1fr);
                      background: white;
                      border: 1px solid black;
                      border-radius: 8px;
                    }
                    .title { grid-column: 2 / 9; grid-row: 1; color: yellow; }
                    #buy { grid-column: 5; grid-row: 2; background: lime; --minecraft-material: DIAMOND; }
                    input { grid-column: 4 / 7; grid-row: 3; }
                  </style>
                  <span class="title">Shop</span>
                  <button id="buy" data-action="buy">Compra</button>
                  <input id="name" data-action="name.submit" data-cancel-action="name.cancel"
                         placeholder="Nome player">
                </div>
                """, "");

        JsonObject inventory = snapshot.getAsJsonObject("inventory");
        assertEquals("shop", inventory.get("id").getAsString());
        assertEquals("Negozio", inventory.get("title").getAsString());
        assertEquals(3, inventory.get("rows").getAsInt());
        JsonArray items = inventory.getAsJsonArray("items");

        assertFalse(hasSlot(items, 0), "border-radius is represented by empty corner slots");
        assertEquals("BLACK_STAINED_GLASS_PANE", item(items, 9).get("material").getAsString());
        assertEquals("DIAMOND", item(items, 13).get("material").getAsString());
        assertEquals("buy", item(items, 13).get("actionId").getAsString());

        JsonObject input = item(items, 21).getAsJsonObject("input");
        assertEquals("name", input.get("id").getAsString());
        assertEquals("Nome player", input.get("placeholder").getAsString());
        assertEquals("name.submit", input.get("submitActionId").getAsString());
        assertEquals("name.cancel", input.get("cancelActionId").getAsString());
    }

    @Test
    void mapsCssColorsToNearestMinecraftDye() {
        JsonObject snapshot = GraalyHtmlUiCompiler.compileSnapshot(
                "<div data-rows=1 style='background:#ff0000'></div>", "");
        JsonObject item = item(snapshot.getAsJsonObject("inventory").getAsJsonArray("items"), 0);
        assertEquals("RED_STAINED_GLASS_PANE", item.get("material").getAsString());
        assertEquals(14, item.get("durability").getAsInt());
    }

    @Test
    void compilesAnOpenDialogIntoTwoClickableAnvilSlots() {
        JsonObject snapshot = GraalyHtmlUiCompiler.compileSnapshot("""
                <dialog id="confirm" open aria-label="Sei sicuro?">
                  <button id="yes" style="background: lime">Sì</button>
                  <button data-action="no" style="background: red">No</button>
                </dialog>
                """, "");

        assertFalse(snapshot.has("inventory"));
        JsonObject modal = snapshot.getAsJsonObject("modal");
        assertEquals("confirm", modal.get("id").getAsString());
        assertEquals("Sei sicuro?", modal.get("title").getAsString());
        JsonArray choices = modal.getAsJsonArray("choices");
        assertEquals(2, choices.size());
        assertEquals(0, choices.get(0).getAsJsonObject().get("slot").getAsInt());
        assertEquals("yes", choices.get(0).getAsJsonObject().get("actionId").getAsString());
        assertEquals(1, choices.get(1).getAsJsonObject().get("slot").getAsInt());
        assertEquals("no", choices.get(1).getAsJsonObject().get("actionId").getAsString());
    }

    @Test
    void supportsAnInputAsTheDocumentRoot() {
        JsonObject snapshot = GraalyHtmlUiCompiler.compileSnapshot(
                "<input id='name' placeholder='Scrivi sul cartello'>", "input { background: white; }");
        JsonObject inputItem = item(snapshot.getAsJsonObject("inventory").getAsJsonArray("items"), 0);
        assertEquals("name", inputItem.get("actionId").getAsString());
        assertEquals("name", inputItem.getAsJsonObject("input").get("id").getAsString());
    }

    @Test
    void rendersHrAsAFullStainedGlassLine() {
        JsonObject snapshot = GraalyHtmlUiCompiler.compileSnapshot(
                "<div data-rows='1'><hr></div>", "");
        JsonArray items = snapshot.getAsJsonObject("inventory").getAsJsonArray("items");
        assertEquals(9, items.size());
        assertEquals("LIGHT_GRAY_STAINED_GLASS_PANE", item(items, 0).get("material").getAsString());
        assertEquals("LIGHT_GRAY_STAINED_GLASS_PANE", item(items, 8).get("material").getAsString());
    }

    @Test
    void rejectsScriptsAndInlineEventHandlers() {
        assertThrows(IllegalArgumentException.class,
                () -> GraalyHtmlUiCompiler.compile("<script>alert(1)</script>", ""));
        assertThrows(IllegalArgumentException.class,
                () -> GraalyHtmlUiCompiler.compile("<button onclick='bad()'>No</button>", ""));
    }

    private static boolean hasSlot(JsonArray items, int slot) {
        for (int index = 0; index < items.size(); index++) {
            if (items.get(index).getAsJsonObject().get("slot").getAsInt() == slot) return true;
        }
        return false;
    }

    private static JsonObject item(JsonArray items, int slot) {
        for (int index = 0; index < items.size(); index++) {
            JsonObject item = items.get(index).getAsJsonObject();
            if (item.get("slot").getAsInt() == slot) return item;
        }
        throw new AssertionError("No item in slot " + slot);
    }
}
