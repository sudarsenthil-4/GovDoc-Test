import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const isDeployed = process.env.BASE_URL !== undefined;

export default defineConfig({
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "local-smoke",
      testDir: "./tests/smoke",
      testMatch: /.*\.spec\.ts$/,
      use: devices["Desktop Chrome"],
    },
    {
      name: "deployed",
      testDir: "./tests/e2e",
      testMatch: /.*\.spec\.ts$/,
      use: devices["Desktop Chrome"],
      timeout: 300_000,
    },
  ],
  ...(isDeployed
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 60_000,
        },
      }),
});
