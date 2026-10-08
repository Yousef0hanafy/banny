import { defineConfig } from "@playwright/test";

const baseURL = process.env.READER_TEST_BASE_URL;
const artifacts = process.env.READER_QA_RUN_DIR;
if (!baseURL || !artifacts || new URL(baseURL).hostname !== "127.0.0.1") {
  throw new Error("Run through bun run test:reader; isolated QA environment required.");
}

export default defineConfig({
  testDir: "./tests/reader",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  outputDir: `${artifacts}/browser`,
  reporter: [["list"], ["json", { outputFile: `${artifacts}/results.json` }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
