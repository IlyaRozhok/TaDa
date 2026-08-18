import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Юнит-тесты фронта — на чистых функциях, DOM не нужен.
    // Появятся тесты компонентов — тогда и добавим jsdom.
    environment: "node",
    // Только src/. Playwright-спеки лежат в e2e/ и запускаются своим раннером
    // (npm run e2e) — vitest не должен их подхватывать.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
