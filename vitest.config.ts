import { defineConfig } from "vitest/config";

// Окремий конфіг, щоб тести не піднімали плагіни Oxygen і React Router з vite.config.ts.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["app/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    environment: "jsdom",
    // Глобальний afterEach потрібен Testing Library, щоб прибирати DOM між тестами.
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
});
