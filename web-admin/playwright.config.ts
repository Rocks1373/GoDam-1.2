import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 60 * 1000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    headless: true,
    ignoreHTTPSErrors: true,
  },
});
