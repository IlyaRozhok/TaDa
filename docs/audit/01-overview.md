# 01 — Обзор проекта и инфраструктуры

> Аудит от 2026-07-28, **пересверен против ветки `develop`** (stage; prod = `main`).
> Первый проход частично выполнялся на `refactor/users-profiles-schema` — расхождения
> и итоговый diff выводов зафиксированы в [`00-revision-note.md`](./00-revision-note.md).
> Документ описывает **фактическое** состояние кода на `develop`, а не желаемое.
>
> **Единственная правка кода за аудит:** `docker-compose.yml` — по отдельному запросу
> владельца дочищены остатки Redis (`depends_on: redis`, `volumes: redis_data`),
> из-за которых compose был невалиден и деплой упал бы. Подробности — в `00`.
> Всё остальное только описано, не изменено.

---

## 1. Топология репозитория

**Это НЕ монорепо.** Нет корневого `package.json`, нет workspaces, нет turbo/nx/pnpm-workspace.
Это два независимых Node-проекта, лежащих рядом в одном git-репозитории:

```
tada-prod/
├── backend/            NestJS 10 + TypeORM 0.3 + PostgreSQL     (свой package.json)
├── frontend/           Next.js 16 + React 19 + Tailwind v4      (свой package.json)
├── docker-compose.yml  только backend (frontend на Vercel; redis вычищен)
├── nginx/              prod.conf, stage.conf
├── infrastructure/     terraform (Hetzner Cloud)
├── .github/workflows/  deploy.yml — единственный пайплайн
└── docs/               superpowers-планы прошлых рефакторингов
```

Следствия такой топологии:
- Общие типы между фронтом и бэком **технически невозможно** переиспользовать без публикации пакета — сейчас DTO дублируются руками (см. `02` и `03`).
- Зависимости версионируются раздельно, единого lockfile нет.
- CI собирает только backend (см. §4).

---

## 2. Как это запускается

| | Backend | Frontend |
|---|---|---|
| Dev | `npm run dev` (`nest start --watch`), порт `PORT ?? 5001` | `npm run dev` (`next dev --turbopack`), порт 3000 |
| Prod build | `tsc && tsc-alias` → `dist/` | `next build` |
| Prod run | `node dist/main.js`, порт 3001 в Docker | Vercel |
| Хостинг | Собственный VPS (Hetzner), Docker + nginx | **Vercel** (`frontend/vercel.json`, регион `iad1`) |
| Домены | `ta-da.co/api`, `stage.ta-da.co/api` | `ta-da.co`, `stage.ta-da.co` |

Глобальный префикс API — `api` (`main.ts`). Swagger — `/api/docs`, в проде закрыт Basic-auth
(`SWAGGER_USER` / `SWAGGER_PASSWORD`).

**Важно:** фронтенд отсутствует в `docker-compose.yml`, хотя `frontend/Dockerfile` и
`frontend/Dockerfile.dev` существуют. Это мёртвые артефакты от предыдущей схемы деплоя —
фронт давно на Vercel. Docker-файлы фронта следует либо удалить, либо задокументировать
как «не используется».

---

## 3. Переменные окружения

**`.env.example` отсутствует полностью** — ни в корне, ни в `backend/`, ни в `frontend/`.
Это блокер онбординга: узнать необходимый набор переменных можно только чтением исходников.

Проверено: `.env`, `.env.production`, `.env.local` **не закоммичены** в git
(`git ls-files | grep .env` → пусто), `.gitignore` покрывает `.env*`. Гигиена секретов в порядке.
Но `backend/.env.production` физически лежит в рабочей копии — это риск при шаринге папки.

Фактический набор переменных backend (из `.env.production` + чтения кода):

```
DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME DB_SSL
JWT_SECRET JWT_ACCESS_EXPIRES_IN JWT_REFRESH_EXPIRES_IN
NODE_ENV PORT
AWS_REGION AWS_S3_BUCKET AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_CALLBACK_URL
FRONTEND_URL
SWAGGER_USER SWAGGER_PASSWORD          ← используются в main.ts, но ОТСУТСТВУЮТ в .env.production
TYPEORM_SYNCHRONIZE TYPEORM_LOGGING
```

Мёртвые/неиспользуемые переменные в `.env.production`:
`CORS_ORIGIN` (CORS-origins захардкожены в `main.ts`), `BCRYPT_ROUNDS`,
`SESSION_CLEANUP_INTERVAL`, `MAX_SESSIONS_PER_DEVICE` (сессий больше нет),
`REDIS_HOST/PORT/PASSWORD/DB` — **Redis из кода удалён на `develop`** (PR #44:
`redis.module.ts` снесён, `ioredis` и `@types/ioredis` убраны из `package.json`),
из `docker-compose.yml` вычищен в ходе аудита; переменные в env остались, см. §6.

Frontend: `NEXT_PUBLIC_API_URL` + ключи EmailJS.

---

## 4. CI/CD

Единственный workflow — `.github/workflows/deploy.yml`.

```
push main|develop, PR→main
  └── build-and-test  (название вводит в заблуждение)
        node 18, npm ci, npm run build   ← ТОЛЬКО backend, ТОЛЬКО сборка
  ├── deploy-staging  (develop) → SSH → git pull → docker compose build/up → mig:run:prod
  └── deploy          (main)    → SSH → git pull → docker compose build/up → mig:run:prod
```

Чего в пайплайне **нет**:
- Тесты не запускаются вообще (job называется `build-and-test`, но тестов не вызывает).
- Нет lint, нет `tsc --noEmit`.
- Frontend не собирается и не проверяется в CI — регрессии фронта ловятся только Vercel-билдом.
- Нет прогона e2e (Playwright-тесты в репозитории есть, но CI их не знает).
- Нет rollback-шага; при падении миграции контейнер уже подменён.
- `sleep 10` вместо ожидания healthcheck.

Несоответствие рантаймов: **CI собирает на Node 18, Docker-образ — `node:20-alpine`.**
Сборка проверяется не на том рантайме, на котором исполняется.

---

## 5. Docker и nginx

`backend/Dockerfile` — корректный multi-stage (builder → production), non-root user `nestjs`,
`npm ci --omit=dev`. Замечания:

1. **`HEALTHCHECK` в Dockerfile бьёт в `http://localhost:3001/health`** — такого маршрута нет,
   глобальный префикс `api`, реальный путь `/api/health`. Healthcheck из Dockerfile всегда
   возвращает 404 → unhealthy. На практике это не выстреливает, потому что `docker-compose.yml`
   переопределяет healthcheck и использует правильный `/api/health`. Но при запуске образа
   без compose контейнер будет вечно unhealthy.
2. `RUN apk add --no-cache vips-dev fftw-dev` — нативные зависимости для `sharp`,
   но **`sharp` отсутствует в `package.json`**. Мёртвый слой, раздувает образ.
3. `COPY database ./database` копирует `backend/database/` — вторую, устаревшую папку миграций
   (см. `02`, §5). В образ попадает мусор.

`nginx/prod.conf` vs `nginx/stage.conf`:

| | server_name | proxy_pass |
|---|---|---|
| stage.conf | stage.ta-da.co | `127.0.0.1:3001` |
| prod.conf | ta-da.co | **`127.0.0.1:3002`** |

`docker-compose.yml` публикует `127.0.0.1:3001:3001`. То есть конфиг прода в репозитории
указывает на порт, который compose из этого же репозитория не открывает. Прод работает,
значит на боевом хосте лежит либо другой compose, либо другой nginx-конфиг.
**Вывод: конфиги в репозитории не являются источником истины для прода.** Требуется сверка
с реальным хостом — это отдельный пункт плана.

---

## 6. Что настроено для прода, а чего нет

**Есть:**
- HTTPS + Let's Encrypt (nginx), редирект 80→443.
- `helmet`, CORS с whitelist, `cookie-parser`.
- httpOnly-cookie аутентификация (`access_token` / `refresh_token`), `secure` в проде, `sameSite: lax`.
- Rotating refresh-токены с хешем в БД (`users.refresh_token_hash`).
- Rate limiting — `@nestjs/throttler`, три уровня (15/сек, 60/10сек, 200/мин), глобальный `APP_GUARD`.
- Sentry (backend): `@sentry/nestjs` + profiling + `SentryGlobalFilter`.
- Security-заголовки на Vercel (`vercel.json`): X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- Healthcheck `/api/health` + healthcheck в compose.
- Миграции как механизм (50 файлов) и шаг применения в CI.

**Нет / сломано:**

| Область | Состояние |
|---|---|
| **Структурное логирование** | Нет. 88 `console.*` в backend, 427 в frontend. `Logger` из Nest использован 1 раз. Нет request-id, нет уровней, нет JSON-логов. |
| **Автозапуск миграций** | Сломан молча — `migrations: ["dist/migrations/*.js"]` указывает не туда (детали в `02`, §5). |
| **Кэш** | Отсутствует. Redis удалён из кода бэкенда на `develop` (PR #44) и вычищен из `docker-compose.yml` в ходе этого аудита. Остаточная чистка: `REDIS_*` в `.env.production` и в `/opt/tada/.env` на хостах, осиротевший том `redis_data` и контейнер `tada-redis` на самих VPS. |
| **Очереди** | Отсутствуют. Все операции синхронные, включая загрузку в S3. |
| **Rate limit при масштабировании** | Throttler хранит счётчики в памяти процесса. При >1 инстанса лимиты множатся на число инстансов. |
| **Sentry на фронте** | Не подключён. Ошибки клиента не видны. |
| **Тесты в CI** | Не запускаются. |
| **`.env.example`** | Нет. |
| **Метрики / APM** | Нет (кроме Sentry-профилирования). |
| **Graceful shutdown** | `enableShutdownHooks()` не вызывается. |
| **Backup-политика БД** | В репозитории следов нет. |
| **`/api/test-sentry`** | Эндпоинт, намеренно бросающий исключение, открыт без авторизации в проде. |

---

## 7. Состояние веток

Рабочий поток: **`develop` (stage) → `main` (prod)**. Домены соответственно
`stage.ta-da.co` и `ta-da.co`. Базовая ветка всех дальнейших работ — `develop`.

В remote 20+ веток, из них минимум 12 — незавершённые рефакторинги
(`refactor/core-structure`, `refactor/property-module-dedup`, `refactoring/frontend`,
`feature/frontend-refactor`, `high-priority-refactoring`, `claude-refactoring`, …).

Это прямо коррелирует с находками в коде: несколько рефакторингов были начаты,
частично влиты и брошены — отсюда три параллельные архитектуры на фронте
(см. `03`) и осиротевшие деревья файлов.

> **Решение владельца:** старые ветки **игнорируем полностью** — не мержим и не разбираем.
> Двигаемся от `develop` по новому флоу. Ветки остаются в remote как исторический след;
> ничего из них не подтягиваем.

---

## 8. Сводка по масштабу

| Метрика | Backend | Frontend |
|---|---|---|
| Файлов `.ts` / `.tsx` | 144 | 383 |
| Строк кода (src) | ~15 800 | ~69 800 |
| Модулей / роутов | 10 модулей, 71 HTTP-маршрут | 30+ страниц App Router |
| Крупнейший файл | `matching-calculation.service.ts` — 1941 стр. | `EditPropertyModal.tsx` — 3057 стр. |
| Тесты | 2 unit-спека (не запускаются — jest не установлен) | 6 Playwright e2e + 1 битый vitest-тест |
| `: any` | 23 | 178 |
| Мёртвые файлы | — | 41 подтверждённых |
| `public/` | — | 38 МБ, отдельные PNG до 4.5 МБ |
