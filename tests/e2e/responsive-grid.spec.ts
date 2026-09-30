import { expect, test } from "@playwright/test";

const guideSections = ["commands", "players", "worlds", "entities", "packets"] as const;

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth);
}

test.describe("responsive documentation grids", () => {
  for (const section of guideSections) {
    test(`${section}: grid stays in viewport and C is interactive`, async ({ page }, testInfo) => {
      await page.goto(`/#${section}`);
      const browser = page.locator(".guide-browser:visible").first();
      await expect(browser).toBeVisible();

      const cTab = browser.getByRole("tab", { name: "C / WebAssembly" });
      await expect(cTab).toBeVisible();
      await cTab.click();
      await expect(cTab).toHaveAttribute("aria-selected", "true");

      const options = browser.getByRole("option");
      await expect(options.first()).toBeVisible();
      if (await options.count() > 1) {
        await options.nth(1).click();
        await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
      }

      const code = browser.locator(".code-block code").first();
      await expect(code).toContainText(/graaly_|#include <graaly\//);
      const cSource = await code.textContent();
      expect(cSource ?? "").not.toMatch(/graaly_(?:get|set|call)\s*\(/);

      const layout = await browser.evaluate(element => {
        const grid = element.querySelector(".guide-browser-grid");
        const index = element.querySelector(".guide-index");
        const detail = element.querySelector(".guide-detail");
        const box = (node: Element | null) => {
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, right: rect.right, bottom: rect.bottom };
        };
        return {
          viewportWidth: innerWidth,
          root: box(element),
          grid: box(grid),
          index: box(index),
          detail: box(detail),
          display: grid ? getComputedStyle(grid).display : null,
        };
      });

      expect(layout.root?.right ?? 0).toBeLessThanOrEqual(layout.viewportWidth + 0.5);
      if (layout.viewportWidth <= 760) {
        expect(layout.display).toBe("block");
        expect(layout.detail?.y ?? 0).toBeGreaterThanOrEqual((layout.index?.bottom ?? 0) - 1);
      } else {
        expect(layout.display).toBe("grid");
      }

      await expectNoHorizontalOverflow(page);

      if (section === "commands" && testInfo.project.name === "iphone-grid") {
        await page.screenshot({
          path: testInfo.outputPath("commands-c-mobile.png"),
          fullPage: true,
        });
      }
    });
  }

  test("event explorer exposes C and stays responsive", async ({ page }) => {
    await page.goto("/#events");
    const browser = page.locator(".event-browser:visible").first();
    await expect(browser).toBeVisible();

    const cTab = browser.getByRole("tab", { name: "C / WebAssembly" });
    await cTab.click();
    await expect(cTab).toHaveAttribute("aria-selected", "true");
    const code = browser.locator(".code-block code").first();
    await expect(code).toContainText("graaly_events_on_type");
    const cSource = await code.textContent();
    expect(cSource ?? "").toContain("graaly_cast");
    expect(cSource ?? "").not.toMatch(/graaly_(?:get|set|call)\s*\(/);
    await expectNoHorizontalOverflow(page);
  });

  test("quick-start language selector includes typed C", async ({ page }) => {
    await page.goto("/#quickstart");
    const quickstartTabs = page.getByRole("tablist", { name: "Quick start language" });
    const cTab = quickstartTabs.getByRole("tab", { name: "C / WebAssembly", exact: true });
    await expect(cTab).toBeVisible();
    await cTab.click();

    const quickStart = page.locator("#quickstart");
    const code = quickStart.locator('code[data-lang="c"]').first();
    await expect(code).toContainText(/graaly_player_t|#include <graaly\/graaly\.h>/);
    const cSource = await code.textContent();
    expect(cSource ?? "").not.toMatch(/graaly_(?:get|set|call)\s*\(/);
    await expectNoHorizontalOverflow(page);
  });

  test("C reference covers API types, wrappers, support types, and packet constants", async ({ page }) => {
    await page.goto("/#api-reference");
    const api = page.locator('[data-api-browser="api"]');
    await expect(api.getByRole("tab", { name: "C / WebAssembly" })).toBeVisible();
    await api.getByRole("tab", { name: "C / WebAssembly" }).click();
    let detail = api.locator(".c-type-reference");
    await expect(detail).toBeVisible();
    await detail.getByRole("searchbox", { name: "Search C members of Player" }).fill("graaly_player_health");
    await expect(detail.locator(".member-list")).toContainText("graaly_player_health(graaly_player_t self, double *out)");
    await expect(detail.locator(".member-list")).toContainText("graaly_player_health_write(graaly_player_t self, double value)");

    await api.getByRole("searchbox", { name: "Search API", exact: true }).fill("graaly_material_find");
    await expect(detail).toContainText("graaly_material_t");
    await detail.getByRole("searchbox", { name: "Search C members of Material" }).fill("find");
    await expect(detail.locator(".member-list")).toContainText("graaly_material_find(const char *name");
    await detail.getByRole("group", { name: "C member type" }).getByRole("button", { name: "Constants", exact: true }).click();
    await detail.getByRole("searchbox").fill("MATERIAL_STONE");
    await expect(detail.locator(".member-list")).toContainText('GRAALY_MATERIAL_STONE "STONE"');

    const catalogs = api.getByRole("tablist", { name: "API catalog" });
    await catalogs.getByRole("tab", { name: /^Wrappers/ }).click();
    await expect(api.getByRole("tab", { name: "C / WebAssembly" })).toHaveAttribute("aria-selected", "true");
    detail = api.locator(".c-type-reference");
    await expect(detail).toContainText("graaly_pe_wrapper_play_server_update_health_t");
    await detail.getByRole("searchbox").fill("__new");
    await expect(detail.locator(".member-list")).toContainText("graaly_pe_wrapper_play_server_update_health__new(double arg0, double arg1, double arg2");
    await catalogs.getByRole("tab", { name: /^Support/ }).click();
    await expect(detail).toContainText("graaly_pe_component_t");
    await expect(detail.locator(".member-list")).toContainText("graaly_pe_component__");

    await catalogs.getByRole("tab", { name: /^Constants/ }).click();
    await expect(api.locator(".constant-usage code").last()).toContainText("graaly_packet_on_receive");
    await api.getByRole("searchbox", { name: "Search API", exact: true }).fill("UPDATE_HEALTH");
    await expect(api.locator(".constant-usage code").last()).toContainText("graaly_packet_on_send");
    await expect(api.locator(".constant-usage code").last()).toContainText("Play.Server.UPDATE_HEALTH");
    await expectNoHorizontalOverflow(page);
  });

  test("C learning path exposes interactive bitset, union, padding, and ownership labs", async ({ page }) => {
    await page.goto("/#learn");
    const learning = page.locator("#learn .learning-guide").first();
    await learning.getByRole("tab", { name: "C / WebAssembly" }).click();
    await learning.getByRole("tab", { name: /Bitsets/ }).click();
    await expect(learning.locator(".learning-example code").first()).toContainText("graaly_bitset_put");
    const labs = page.locator(".c-advanced-labs");
    for (const [label, code] of [["Tagged unions", "union"], ["Alignment and padding", "offsetof"],
      ["Explicit serialization", "graaly_u32_store_le"], ["Flexible array ownership", "SIZE_MAX"]]) {
      await labs.getByRole("tab", { name: new RegExp(label) }).click();
      await expect(labs.locator(".code-block code")).toContainText(code);
    }
    await expectNoHorizontalOverflow(page);
  });

  test("every PacketEvents workflow has a real C example", async ({ page }) => {
    await page.goto("/#packets");
    const guide = page.locator("#packets .guide-browser");
    await guide.getByRole("tab", { name: "C / WebAssembly" }).click();
    const options = guide.getByRole("option");
    await expect(options).toHaveCount(8);
    for (let index = 0; index < 8; index++) {
      await options.nth(index).click();
      await expect(guide.locator(".code-block code")).toContainText("#include <graaly/packets.h>");
      await expect(guide.locator(".code-block code")).not.toContainText("C equivalent uses");
    }
    const api = page.locator('[data-api-browser="packetevents catalog"]');
    await api.scrollIntoViewIfNeeded();
    await api.getByRole("tab", { name: "C / WebAssembly" }).click();
    await expect(api.locator(".constant-usage code").last()).toContainText("graaly_packet_on_receive");
    await expectNoHorizontalOverflow(page);
  });
});
