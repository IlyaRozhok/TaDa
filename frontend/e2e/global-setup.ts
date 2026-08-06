/**
 * Подготовка сессий для e2e без тест-логин роута на бэкенде.
 *
 * Раньше здесь дёргался POST /api/auth/test-login — бэкдор, который удалён
 * из приложения. Вместо него:
 *   1. пользователи засеваются прямо в Postgres через psql (идемпотентно);
 *   2. JWT выпускается локально тем же алгоритмом и секретом, что и в бэкенде;
 *   3. кука кладётся в storageState, который читают фикстуры.
 *
 * Токены выпускаются на каждом прогоне, поэтому протухание сохранённых
 * состояний — прошлая причина падения всей сетки — исключено конструктивно.
 *
 * Требования к окружению: доступный psql и backend/.env с DB_* и JWT_SECRET.
 */
import { execFileSync } from "child_process";
import { createHmac } from "crypto";
import * as fs from "fs";
import * as path from "path";

import { BASE_URL } from "./env";

const AUTH_DIR = path.join(__dirname, ".auth");
export const BACKEND_ENV = path.join(__dirname, "..", "..", "backend", ".env");

/** Access-токен живёт 15 минут — столько же, сколько выдаёт приложение. */
const ACCESS_TTL_SECONDS = 15 * 60;

type Role = "tenant" | "admin" | "operator";

interface SeedUser {
  id: string;
  email: string;
  role: Role;
  /**
   * Заполнены ли шесть полей, которые проверяет isProfileComplete().
   * Это НЕ то же самое, что пройденный онбординг: сам флоу собирает только
   * phone и date_of_birth, поэтому у реального пользователя профиль обычно
   * неполон. Разделено намеренно — ради сценария «прошёл онбординг,
   * профиль неполный».
   */
  profileComplete: boolean;
  /** Пройден ли флоу: строка в preferences + флаг в localStorage. */
  completedOnboarding: boolean;
  stateFile: string;
}

/**
 * Фиксированные UUID делают засев идемпотентным и позволяют опознать
 * тестовые строки в базе глазами.
 */
const SEED_USERS: SeedUser[] = [
  {
    id: "e2e00000-0000-4000-8000-000000000001",
    email: "e2e-tenant@tada-e2e.local",
    role: "tenant",
    profileComplete: true,
    completedOnboarding: true,
    stateFile: "tenant.json",
  },
  {
    id: "e2e00000-0000-4000-8000-000000000002",
    email: "e2e-fresh-tenant@tada-e2e.local",
    role: "tenant",
    profileComplete: false,
    completedOnboarding: false,
    stateFile: "fresh-tenant.json",
  },
  {
    id: "e2e00000-0000-4000-8000-000000000003",
    email: "e2e-admin@tada-e2e.local",
    role: "admin",
    profileComplete: true,
    completedOnboarding: true,
    stateFile: "admin.json",
  },
  {
    // Типовой случай для админа, заведённого через админ-панель: профиль пустой.
    // До унификации гварда такой пользователь не мог открыть саму панель.
    id: "e2e00000-0000-4000-8000-000000000004",
    email: "e2e-admin-partial@tada-e2e.local",
    role: "admin",
    profileComplete: false,
    completedOnboarding: true,
    stateFile: "admin-partial.json",
  },
  {
    // Operators have no dashboard of their own any more (step 2А.2). This user
    // exists to prove the role still lands on a working page instead of the
    // role-selection screen or a route that is about to be deleted.
    id: "e2e00000-0000-4000-8000-000000000005",
    email: "e2e-operator@tada-e2e.local",
    role: "operator",
    profileComplete: true,
    completedOnboarding: true,
    stateFile: "operator.json",
  },
];

export function parseEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) {
    throw new Error(
      `e2e global-setup: не найден ${file}. Нужны DB_* и JWT_SECRET бэкенда.`,
    );
  }

  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

export function createPsqlRunner(env: Record<string, string>) {
  const args = [
    "-h",
    env.DB_HOST ?? "localhost",
    "-p",
    env.DB_PORT ?? "5432",
    "-U",
    env.DB_USER ?? "postgres",
    "-d",
    env.DB_NAME ?? "postgres",
    "-tA",
    "-v",
    "ON_ERROR_STOP=1",
  ];

  return (sql: string): string => {
    try {
      return execFileSync("psql", [...args, "-c", sql], {
        encoding: "utf8",
        env: { ...process.env, PGPASSWORD: env.DB_PASSWORD ?? "" },
      }).trim();
    } catch (error) {
      const details =
        error instanceof Error && "stderr" in error
          ? String((error as { stderr?: Buffer }).stderr ?? error.message)
          : String(error);
      throw new Error(`e2e global-setup: psql упал.\nSQL: ${sql}\n${details}`);
    }
  };
}

/** Экранирование строкового литерала для SQL. */
const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`;

/**
 * Возвращает фактический id строки: при конфликте по email берётся id
 * существующего пользователя, а не тот, что мы предложили. Это защищает
 * от ломки внешних ключей, если тестовый юзер уже был заведён иначе.
 */
function seedUser(psql: (sql: string) => string, user: SeedUser): string {
  /**
   * Шесть полей, которые проверяет isProfileComplete(). Заполняем или явно
   * обнуляем — второе важно при повторном прогоне, чтобы пользователь
   * с неполным профилем таким и остался.
   */
  const profile = user.profileComplete
    ? {
        first_name: quote("E2E"),
        last_name: quote(user.role[0].toUpperCase() + user.role.slice(1)),
        address: quote("1 Test Street, London"),
        phone: quote("+447700900000"),
        date_of_birth: quote("1990-01-01"),
        nationality: quote("British"),
      }
    : {
        first_name: "NULL",
        last_name: "NULL",
        address: "NULL",
        phone: "NULL",
        date_of_birth: "NULL",
        nationality: "NULL",
      };

  // psql печатает тег команды ("INSERT 0 1") следующей строкой после RETURNING,
  // поэтому берём только первую строку вывода.
  const [id] = psql(`
    INSERT INTO users (id, email, role, status, provider, email_verified, full_name,
                       first_name, last_name, address, phone, date_of_birth, nationality)
    VALUES (${quote(user.id)}, ${quote(user.email)}, ${quote(user.role)}, 'active', 'google', true,
            ${quote(`E2E ${user.role}`)},
            ${profile.first_name}, ${profile.last_name}, ${profile.address},
            ${profile.phone}, ${profile.date_of_birth}, ${profile.nationality})
    ON CONFLICT (email) DO UPDATE
      SET role = EXCLUDED.role,
          status = EXCLUDED.status,
          email_verified = EXCLUDED.email_verified,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          date_of_birth = EXCLUDED.date_of_birth,
          nationality = EXCLUDED.nationality
    RETURNING id;
  `).split("\n");

  if (!id) {
    throw new Error(`e2e global-setup: не удалось засеять ${user.email}`);
  }

  if (user.completedOnboarding) {
    psql(`
      INSERT INTO preferences (user_id) VALUES (${quote(id)})
      ON CONFLICT (user_id) DO NOTHING;
    `);
  } else {
    // Свежий пользователь не должен иметь предпочтений — иначе SessionManager
    // сочтёт онбординг пройденным и тест редиректа развалится.
    psql(`DELETE FROM preferences WHERE user_id = ${quote(id)};`);
  }

  return id;
}

/**
 * HS256-JWT тем же алгоритмом и секретом, что и бэкенд. Claims передаются
 * целиком, включая iat/exp: сессионным тестам нужны и просроченный access,
 * и живой refresh, которых у обычного засева нет.
 */
export function signJwt(secret: string, claims: Record<string, unknown>): string {
  const base64url = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  const header = base64url({ alg: "HS256", typ: "JWT" });
  const body = base64url(claims);
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/** Access-токен с той же полезной нагрузкой, что выпускает AuthService. */
function signAccessToken(
  secret: string,
  payload: { sub: string; email: string; role: Role },
): string {
  const issuedAt = Math.floor(Date.now() / 1000);

  return signJwt(secret, {
    ...payload,
    status: "active",
    iat: issuedAt,
    exp: issuedAt + ACCESS_TTL_SECONDS,
  });
}

function writeStorageState(user: SeedUser, userId: string, token: string): void {
  const { hostname, protocol, origin } = new URL(BASE_URL);

  /**
   * Флаг онбординга в localStorage. authSlice читает его синхронно при setUser
   * (`onboarding_completed_<id>`), поэтому у реального пользователя isOnboarded
   * поднимается сразу. Без флага остаётся только асинхронная ветка через
   * preferencesAPI, и guard успевает увести со страницы раньше её ответа —
   * то есть синтетическая сессия вела бы себя не как настоящая.
   */
  const origins = user.completedOnboarding
    ? [
        {
          origin,
          localStorage: [
            { name: `onboarding_completed_${userId}`, value: "1" },
          ],
        },
      ]
    : [];

  const storageState = {
    cookies: [
      {
        name: "access_token",
        value: token,
        domain: hostname,
        path: "/",
        expires: Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS,
        httpOnly: true,
        secure: protocol === "https:",
        sameSite: "Lax" as const,
      },
    ],
    origins,
  };

  const target = path.join(AUTH_DIR, user.stateFile);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(target, JSON.stringify(storageState, null, 2));
}

export default async function globalSetup(): Promise<void> {
  const env = parseEnvFile(BACKEND_ENV);

  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error("e2e global-setup: в backend/.env нет JWT_SECRET.");
  }

  const psql = createPsqlRunner(env);

  for (const user of SEED_USERS) {
    const id = seedUser(psql, user);
    const token = signAccessToken(secret, { sub: id, email: user.email, role: user.role });
    writeStorageState(user, id, token);
    console.log(`[global-setup] сессия готова: ${user.email} → ${user.stateFile}`);
  }
}
