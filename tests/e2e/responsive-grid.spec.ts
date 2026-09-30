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
});
