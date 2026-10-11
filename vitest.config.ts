import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/domain.test.ts"],
    fileParallelism: false,
    env: { DATABASE_URL: "file:./test.db" },
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
