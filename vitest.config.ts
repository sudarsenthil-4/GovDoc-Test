import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: [...configDefaults.exclude, "tests/smoke/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      thresholds: {
        "lib/auth/**": { lines: 100, branches: 100 },
        "lib/sse/**": { lines: 90, branches: 80 },
        "lib/rubric/**": { lines: 95, branches: 90 },
        "lib/exporters/**": { lines: 95, branches: 90 },
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
