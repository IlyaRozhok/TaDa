import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // The tsconfig "@/..." paths all point into src/ (@/lib → src/lib,
    // @/store → src/store, …), so one alias resolves every one of them and
    // modules under test can import through the alias like the app does.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Юнит-тесты фронта — на чистых функциях, DOM не нужен.
    // Появятся тесты компонентов — тогда и добавим jsdom.
    environment: "node",
    // Только src/. Playwright-спеки лежат в e2e/ и запускаются своим раннером
    // (npm run e2e) — vitest не должен их подхватывать.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
