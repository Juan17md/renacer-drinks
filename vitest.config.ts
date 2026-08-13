import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./src/tests/__mocks__/server-only.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**/*.ts",
        "src/services/**/*.ts",
        "src/store/**/*.ts",
        "src/utils/**/*.ts",
        "src/hooks/**/*.ts",
        "src/actions/**/*.ts",
      ],
      exclude: ["src/lib/firebase.ts", "src/lib/imagekit.ts"],
    },
  },
});