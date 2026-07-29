/**
 * Регрессия на R1 (шаг 0.1): эскалация привилегий через PUT /users/:id/role.
 *
 * До фикса маршрут был закрыт только JwtAuthGuard, а проверка в теле метода
 * пропускала запрос, если пользователь менял роль сам себе. Любой залогиненный
 * мог выставить себе role=admin.
 *
 * Тест на уровне API, без UI: маршрут дёргается напрямую под сессией арендатора.
 */
import { test, expect } from "@playwright/test";
import * as path from "path";

import { API_URL } from "./env";

const TENANT_STATE = path.join(__dirname, ".auth", "tenant.json");

test("tenant cannot escalate own role to admin", async ({ playwright }) => {
  // Абсолютные URL, а не baseURL: API_URL содержит префикс /api, и относительный
  // путь с ведущим слэшем его бы затёр.
  const api = await playwright.request.newContext({
    storageState: TENANT_STATE,
  });

  try {
    const meBefore = await api.get(`${API_URL}/auth/me`);
    expect(meBefore.status()).toBe(200);

    const { user } = await meBefore.json();
    expect(user.role).toBe("tenant");

    const escalation = await api.put(`${API_URL}/users/${user.id}/role`, {
      data: { role: "admin" },
    });

    // Маршрут закрыт @Auth("admin") — арендатор не проходит RolesGuard.
    expect(escalation.status()).toBe(403);

    // Контроль: роль не изменилась на стороне сервера.
    const meAfter = await api.get(`${API_URL}/auth/me`);
    expect(meAfter.status()).toBe(200);
    expect((await meAfter.json()).user.role).toBe("tenant");
  } finally {
    await api.dispose();
  }
});
