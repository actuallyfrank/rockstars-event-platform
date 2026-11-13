import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL(".", import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        // Unit + integration tests: plain Node, no DOM.
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: ["node_modules/**", "e2e/**", ".next/**"],
        },
      },
      {
        // Component tests: React Testing Library in jsdom.
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "component",
          environment: "jsdom",
          include: ["**/*.test.tsx"],
          exclude: ["node_modules/**", "e2e/**", ".next/**"],
          setupFiles: ["./test/setup-dom.ts"],
        },
      },
    ],
  },
});
