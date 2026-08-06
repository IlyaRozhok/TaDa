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
├── docker-compose.yml  backend + redis (frontend на Vercel; redis не используется кодом)
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
но **из `docker-compose.yml` НЕ удалён** и переменные в env остались, см. §6.

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

### 5.1 Host reconciliation — step 3.1, closed 2026-08-06

The audit's open question here was the port: `nginx/prod.conf` proxied to `127.0.0.1:3002`
while `docker-compose.yml` published `127.0.0.1:3001:3001`, and production was nevertheless
serving traffic. Three explanations were possible — a different compose on the host, a
different nginx config, or uncommitted drift in `/opt/tada/app`. Both VPSes were read
read-only on 2026-08-06; the answer is the second one, and it is more thorough than expected.

**Both `nginx/*.conf` files in the repository were dead.** They are not deployed by anything:
`.github/workflows/deploy.yml` only runs `git pull` + `docker compose build/up` inside
`/opt/tada/app` and never writes to `/etc/nginx`. The live vhosts were written by hand on the
hosts and their TLS lines are Certbot-managed. Nothing on either host has ever listened on
**3002** — that port existed only in a repository file no machine read.

| | Repository (before 3.1) | prod host | stage host |
|---|---|---|---|
| nginx file | `nginx/prod.conf`, `nginx/stage.conf` | `/etc/nginx/sites-enabled/tada-prod` | `/etc/nginx/sites-enabled/api.stage.ta-da.co` |
| Deployed by | nothing | by hand + Certbot | by hand + Certbot |
| `server_name` | `ta-da.co` / `stage.ta-da.co` | **`api.ta-da.co`** | **`api.stage.ta-da.co`** |
| `location` | `/api/` | **`/`** | **`/`** |
| `proxy_pass` | **`:3002`** / `:3001` | `http://127.0.0.1:3001` | `http://127.0.0.1:3001` |
| `client_max_body_size` | 25M | **50M** (server level) | **50M** (server level) |
| WebSocket upgrade headers | absent | absent | **present** |
| `X-Content-Type-Options`, `Referrer-Policy` | declared | absent at the proxy (helmet sets both) | absent at the proxy (helmet sets both) |
| compose | backend `127.0.0.1:3001:3001`, redis, `depends_on: redis healthy` | identical | identical |
| Local drift in `/opt/tada/app` | — | none (`git status` clean, no infra diff) | none |
| Checked-out ref | — | `main` @ `d3d49a9` (Merge #74) | `main` @ `c4102b6` (= `develop` head) |
| `tada-redis` | in compose | Up 3 months | Up 5 weeks |
| Listening | — | 3001 (docker-proxy), 6379, 80/443, 5432 · **3002 and 5001: nothing** | same |
| `/api/health` on 3001 | — | 200 | 200 |
| `SWAGGER_USER/PASSWORD` | required in prod | **set** | **set** |
| `SENTRY_DSN` | optional | set | **absent** |

Decisions taken, one per row that disagreed:

1. **nginx — repository follows the host.** Both `.conf` files were rewritten to transcribe the
   live vhosts, with a header stating they are a reference copy applied by hand, and that the
   host wins on any disagreement. The hosts were not touched.
2. **Port 3002 — deleted, not reconciled.** There was nothing on the host to reconcile it with.
3. **`client_max_body_size` 25M → 50M** in the repo copies: the hosts have always allowed 50M,
   and the smaller number in the repo would have silently tightened uploads had anyone ever
   applied these files.
4. **The two security headers were dropped from the repo copies and no cover is lost.**
   `add_header X-Content-Type-Options "nosniff"` and `Referrer-Policy` were in both repo files
   and are on neither host — but `helmet` runs inside Nest (`main.ts:32`) and sets both by
   default, so responses carry them regardless of the proxy. The one difference worth knowing
   is the value: helmet's default is `Referrer-Policy: no-referrer`, the dead nginx files said
   `no-referrer-when-downgrade`. Nothing to fix; recorded so the removal is not read later as a
   silent weakening.
5. **compose — repository already matched reality**, on both hosts, with no local drift. That
   makes the automated deploy safe as it stands, and it means the Redis removal in 3.2 will
   land on the hosts exactly as written.
6. **Prod is far behind `develop`** — `d3d49a9` (Merge #74) against `c4102b6`. Stage is current.
   The next `develop → main` release therefore ships the whole refactoring at once and runs the
   accumulated migrations, including `1785250907864-DropDuplicateProfileIdentityColumns`, which
   the 0.3 reconciliation flagged as probably not applied on prod.

**`/opt/tada/.env` — keys only, values never read.** Both hosts carry the same set:
`NODE_ENV`, `PORT`, `DB_*`, `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`,
`GOOGLE_*`, `AWS_*`, `FRONTEND_URL`, `CORS_ORIGIN`, `SWAGGER_USER`, `SWAGGER_PASSWORD`,
`REDIS_*`, `BCRYPT_ROUNDS`, `SESSION_CLEANUP_INTERVAL`, `MAX_SESSIONS_PER_DEVICE`. Prod also has
`SENTRY_DSN`; stage does not. Three findings:

- **`SWAGGER_USER` / `SWAGGER_PASSWORD` are set on both.** The risk recorded on 2026-07-31 —
  that `/api/docs` answers 401 to everyone in production because the credentials are undefined —
  **does not exist on the hosts.** It was inferred from the local, gitignored
  `backend/.env.production`, which is not what the servers run. Closed.
- **🔴 `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` are set on both hosts, and the code
  lets the environment win.** `resolveTokenTtl` (`common/config/auth-tokens.config.ts`) takes the
  env value whenever it parses and falls back to the built-in default only on a typo. The
  30-day refresh window that the silent-refresh bugfix introduced as
  `REFRESH_TOKEN_TTL_DEFAULT` is therefore **not** what prod and stage are running — they are
  running whatever those two variables say. The file's own comment («the defaults live here
  rather than in the hosts' `.env` on purpose») describes an intent the hosts do not honour.
  This needs a host action before the fix can be called delivered: either set
  `JWT_REFRESH_EXPIRES_IN=30d` or remove the variable so the default applies.
- **The dead variables are confirmed present on the hosts**, so the 3.2 cleanup has real work
  to do rather than a theoretical one: `REDIS_*` (nothing reads them since PR #44) and
  `BCRYPT_ROUNDS` / `SESSION_CLEANUP_INTERVAL` / `MAX_SESSIONS_PER_DEVICE` (leftovers from
  password auth and server-side sessions, neither of which exists). `CORS_ORIGIN` is set and
  **is** read — 3.4 made it a merge into the built-in origin list.

**As of this step the repository is the source of truth for infrastructure**, with one stated
exception: nginx is host-managed, and `nginx/*.conf` are mirrors that have to be updated by hand
after any host change. Question Q4 is closed.

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
| **Кэш** | Отсутствует. Redis удалён **только из кода** бэкенда на `develop` (PR #44). В `docker-compose.yml` сервис `redis`, том `redis_data` и `depends_on: redis: condition: service_healthy` у backend **всё ещё на месте** — compose поднимает и ждёт готовности сервиса, которым никто не пользуется. Ветка `chore/remove-redis-compose` была удалена без мержа (2026-07-28), удаление делается заново в Фазе 3.2. Туда же: `REDIS_*` в `.env.production` и в `/opt/tada/.env` на хостах, осиротевший том и контейнер `tada-redis` на VPS. |
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
