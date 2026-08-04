import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    // e2e/**: specs do Playwright (CRM-F0-08), não do Vitest - mesmo padrão
    // *.spec.ts, precisa ser excluído explicitamente para não colidir.
    exclude: [...configDefaults.exclude, "**/e2e/**"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
