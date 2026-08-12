import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    // A production build+start, not `next dev`: this Next.js canary's dev-mode
    // Turbopack worker pool crashes intermittently under test load ("Jest
    // worker encountered 2 child process exceptions"), taking down whatever
    // API route was mid-compile and failing requests with a 500 — flaky in a
    // way that has nothing to do with the app itself. A prod server is
    // pre-compiled once, so that whole failure class doesn't exist.
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { BILLING_MOCK: "1" },
  },
});
