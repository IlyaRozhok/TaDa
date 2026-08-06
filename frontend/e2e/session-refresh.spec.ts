import { test, expect } from "@playwright/test";
import { createHash } from "crypto";

import { BASE_URL } from "./env";
import { BACKEND_ENV, createPsqlRunner, parseEnvFile, signJwt } from "./global-setup";

/**
 * Регрессия на «разлогинивает через несколько часов».
 *
 * Сценарий ровно тот, в который попадает живой пользователь: access-токен
 * протух, refresh-кука цела. Приложение обязано молча обновить пару и остаться
 * в сессии — а не выбросить на первом 401.
 *
 * Тест дополнительно фиксирует две вещи, ради которых сделан общий
 * координатор: страница /app/units поднимает несколько запросов сразу и через
 * оба клиента (axios в SessionManager + RTK Query), но `POST /auth/refresh`
 * должен уйти РОВНО ОДИН — второй параллельный refresh предъявил бы уже
 * провёрнутый токен и получил бы «reuse detected», то есть настоящий разлогин.
 *
 * На коде до фикса тест падает: refresh не уходит вовсе, 401 от /auth/me
 * приводит к logout и гвард уводит со страницы.
 */

const TENANT_EMAIL = "e2e-tenant@tada-e2e.local";
const DAY_SECONDS = 24 * 60 * 60;

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

test("session survives an expired access token and refreshes exactly once", async ({
  browser,
}) => {
  const env = parseEnvFile(BACKEND_ENV);
  const secret = env.JWT_SECRET;
  expect(secret, "backend/.env must carry JWT_SECRET").toBeTruthy();

  const psql = createPsqlRunner(env);
  const [userId] = psql(
    `SELECT id FROM users WHERE email = '${TENANT_EMAIL}';`,
  ).split("\n");
  expect(userId, `seeded user ${TENANT_EMAIL} not found`).toBeTruthy();

  const now = Math.floor(Date.now() / 1000);

  // Просрочен на минуту — ровно то, что браузер отдаёт после смерти access.
  const expiredAccess = signJwt(secret, {
    sub: userId,
    email: TENANT_EMAIL,
    role: "tenant",
    status: "active",
    iat: now - 3600,
    exp: now - 60,
  });

  // Живой refresh. Бэкенд сверяет его sha256 с users.refresh_token_hash,
  // поэтому хеш кладём в базу — иначе ротация отвергнет токен как чужой.
  const refreshToken = signJwt(secret, {
    sub: userId,
    type: "refresh",
    iat: now,
    exp: now + 30 * DAY_SECONDS,
  });
  psql(
    `UPDATE users SET refresh_token_hash = '${sha256(refreshToken)}' WHERE id = '${userId}';`,
  );

  const { hostname, protocol, origin } = new URL(BASE_URL);
  const cookieBase = {
    domain: hostname,
    path: "/",
    httpOnly: true,
    secure: protocol === "https:",
    sameSite: "Lax" as const,
  };

  const context = await browser.newContext({
    storageState: {
      cookies: [
        { ...cookieBase, name: "access_token", value: expiredAccess, expires: now + 3600 },
        { ...cookieBase, name: "refresh_token", value: refreshToken, expires: now + 30 * DAY_SECONDS },
      ],
      origins: [
        {
          origin,
          localStorage: [{ name: `onboarding_completed_${userId}`, value: "1" }],
        },
      ],
    },
  });

  const page = await context.newPage();

  const refreshCalls: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/auth/refresh")) {
      refreshCalls.push(request.url());
    }
  });

  await page.goto("/app/units");

  // Контент грузится — значит запросы переиграны с новым токеном, а не отвалились.
  await expect(page.getByTestId("property-card").first()).toBeVisible({
    timeout: 15_000,
  });

  // Сессия жива: гвард не увёл со страницы.
  expect(page.url()).toMatch(/\/app\/units/);

  // Один refresh на весь шторм 401, а не по одному на каждый запрос.
  expect(refreshCalls).toHaveLength(1);

  await context.close();
});
