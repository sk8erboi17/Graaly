import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "iphone-grid",
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 408, height: 888 },
      },
    },
    {
      name: "mobile-narrow",
      use: {
        browserName: "chromium",
        viewport: { width: 320, height: 740 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: {
    command: "python3 -m http.server 4173 --directory docs",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
