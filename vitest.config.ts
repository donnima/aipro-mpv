import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "apps/web/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/e2e/**", "**/dist/**"],
  },
  resolve: {
    alias: {
      "@aipro/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@aipro/types": path.resolve(__dirname, "packages/types/src/index.ts"),
    },
  },
});
