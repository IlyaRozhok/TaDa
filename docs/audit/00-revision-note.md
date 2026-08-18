# 00 — Ревизия аудита против `develop`

**Дата первого прохода:** 2026-07-28, ветка `refactor/users-profiles-schema`
**Дата ревизии:** 2026-07-28, ветка **`develop`** (stage; prod = `main`)

---

## Что произошло

Первый проход аудита начался на ветке `refactor/users-profiles-schema`. **Посреди аудита
рабочее дерево было переключено на `develop`**, из-за чего часть ранних находок снята
со старого состояния, а часть поздних — уже с `develop`. Это объясняет странности,
замеченные по ходу: `RedisModule` читался в `app.module.ts`, а через несколько шагов
файла уже не было.

Все выводы **пересверены заново против `develop`** с чистым рабочим деревом.
Ниже — что изменилось. Документы `01`–`05` приведены в соответствие.

```
git branch --show-current   → develop
develop ← refactor/users-profiles-schema:  10 коммитов сверху, 0 в обратную сторону
develop полностью включает аудированную ветку (PR #39 влит)
```

Диапазон расхождения — 15 файлов, +72 / −759 строк:

```
backend/package.json                                   -2   (ioredis, @types/ioredis)
backend/src/app.module.ts                              -2   (RedisModule)
backend/src/common/services/redis.module.ts           -40   удалён
backend/src/modules/auth/auth.module.ts               ±12
backend/src/modules/auth/services/auth-token.service.ts      -189  удалён
backend/src/modules/auth/services/auth-validation.service.ts -120  удалён
backend/src/modules/auth/strategies/google.strategy.ts  ±4
frontend/src/app/app/onboarding/page.tsx               ±42
frontend/src/app/app/units/page.tsx                     +3
frontend/src/app/components/AuthModal.tsx             -265  Google-only
frontend/src/app/components/UserDropdown.tsx           ±2
frontend/src/app/hooks/useAuth.ts                     -101  удалён
frontend/src/app/lib/api.ts                            -16  мёртвый password-слой
frontend/src/store/slices/apiSlice.ts                  -17
frontend/src/store/slices/authSlice.ts                ±16
```

Соответствующие PR на `develop`: #44 (remove dead redis sessions),
#45 (AuthModal → Google-only, remove dead password API layer),
#46 (profile dropdown / onboarding fixes).

---

## Diff выводов: первый проход → ревизия на `develop`

### Снято с повестки (уже сделано на `develop`)

| Находка первого прохода | Статус на `develop` |
|---|---|
| Redis-модуль в коде бэкенда | ✅ **Удалён полностью.** `redis.module.ts` нет, `ioredis` и `@types/ioredis` убраны из `package.json`, `app.module.ts` его не импортирует. Проверено. |
| `app/hooks/useAuth.ts` — мёртвый хук | ✅ **Удалён** (−101 строка). Из списка мёртвого кода убран. |
| Фронт зовёт `/auth/login`, `/auth/register`, `/auth/check-user`, `/auth/authenticate` — маршрутов нет | ✅ **Мёртвый password-слой вырезан** из `app/lib/api.ts` и `apiSlice.ts`, `AuthModal` переведён на Google-only (−265 строк). В дрейфе контракта этих вызовов больше нет. |
| `auth-token.service.ts`, `auth-validation.service.ts` | ✅ Удалены (−309 строк суммарно). |

### Переформулировано

| Находка | Уточнение по `develop` |
|---|---|
| **R22 «Redis»** | Формулировка «Redis-модуль удалён, контейнер остался» **подтверждена и сужена**: код чист, но `docker-compose.yml` по-прежнему содержит сервис `redis`, том `redis_data`, healthcheck и `depends_on: redis: condition: service_healthy` у backend. То есть compose поднимает и **ждёт готовности сервиса, которым никто не пользуется**. Переменные `REDIS_*` остались в `.env.production`. Риск понижен до низкого, но пункт остаётся. |
| **Tailwind `xs:` (R11)** | **Исправлено — это была ошибка первого прохода.** Заявленные «14 использований брейкпоинта `xs:`» — ложное срабатывание grep: совпадения оказались ключами TS-объектов (`xs: "px-2 py-1 text-xs"` в `Button.tsx`, `xs:` в `tokens/spacing.ts`, `typography.ts`), а не Tailwind-префиксом. Точный подсчёт `\bxs:[a-z-]+` → **0 использований**. Сам вывод (конфиг игнорируется) остаётся верным и подтверждён эмпирически, но масштаб визуальных последствий меньше заявленного. |
| **Tailwind: что реально сломано** | Уточнено: `font-sf-pro` — **20 использований в 9 файлах** (подтверждено, реальные `className`); `min-h-touch-sm` — 2 использования (`UniversalHeader.tsx`), плюс рядом кастомный `p-0.75`; `max-w-mobile/tablet/desktop` — 0. |
| **Дрейф контракта** | Пересчитан с корректной нормализацией параметров (`${id}` ↔ `:id`) — в первом проходе часть строк была ложной. Актуальный список — в `03`, §5.3. Добавлен ранее пропущенный `/operator/suggest-property`. |
| **`console.*` на фронте** | 427 → **430** (на `develop` добавились). |

### Подтверждено без изменений на `develop`

| Находка | Проверка |
|---|---|
| **R1 — эскалация привилегий** | `users.controller.ts:173-185` — без изменений. `@UseGuards(JwtAuthGuard)` без `RolesGuard`, условие `req.user.id !== id && req.user.role !== Admin` пропускает смену своей роли. **Актуально и критично.** |
| **R2 — путь миграций** | `typeorm.config.ts:17` — `migrations: ["dist/migrations/*.js"]`, `migrationsRun: !isDev`. Без изменений. **Актуально.** |
| **R3 — дрейф миграций** | 50 файлов на диске, 51 запись в локальной БД. Без изменений. |
| **R4 — ни одного индекса** | Подтверждено. |
| **R5 — дашборд оператора** | Подтверждено, см. новый раздел про удаление operator-функционала. |
| **R17 — `/api/test-sentry`** | `app.controller.ts:18` на месте. |
| **R21 — `backend/database/`** | 3 файла на месте, `COPY database ./database` в Dockerfile на месте. |
| **Dockerfile: `HEALTHCHECK /health`** | Строка 39 — по-прежнему `/health` вместо `/api/health`. `vips-dev`/`fftw-dev` без `sharp` — строка 21, на месте. |
| **Мёртвый код фронта** | Пересканировано резолвером: **41 файл** (состав скорректирован — `useAuth.ts` выбыл). `src/components/` — по-прежнему **0 входящих импортов**. |
| **tsconfig фронта** | `strict: false`, `noImplicitAny: false`, `strictNullChecks: false` — без изменений. 178 `: any`. |
| **Typecheck** | Backend `tsc --noEmit` → чисто. Frontend → **одна ошибка**, `area.test.ts` (vitest не установлен). |
| **Tailwind-конфиг игнорируется** | `@config` в `globals.css` отсутствует. Вывод в силе. |

### Добавлено по итогам ревизии

- Инвентаризация operator-функционала под удаление (решение владельца) — `05`, Фаза 2А.
- Зафиксированы принятые архитектурные решения — см. ниже.

---

## `docker-compose.yml` — история правки Redis (в `develop` не попала)

> ⚠️ **СТАТУС НА 2026-07-28, ВЕЧЕР: в `develop` эта правка НЕ ПОПАЛА.**
> Ветка `chore/remove-redis-compose` была удалена без мержа. В `develop` сервис
> `redis`, том `redis_data` и `depends_on` у backend **на месте**.
> Раздел ниже описывает ход работы того дня, а не текущее состояние ветки.
> Удаление делается заново в Фазе 3.2 — см. `05-refactoring-plan.md` §3.2.

> **Это решение владельца, а не случайная правка.** Redis больше не участвует
> в аутентификации (сессий на Redis нет — схема cookie + JWT с `refresh_token_hash`
> в БД), кэша на нём тоже нет. Сервис в compose был чистым наследием.
> Изменение **остаётся, откат не требуется.**

Ход событий: в рабочем дереве лежала незакоммиченная правка — сервис `redis`
удалён, **но остались две ссылки на него** —
`depends_on: redis: condition: service_healthy` у `backend` и секция `volumes: redis_data`.

```
$ docker compose -f docker-compose.yml config
service "backend" depends on undefined service "redis": invalid compose project   (exit 1)
```

Это блокировало бы деплой на обоих окружениях: CI выполняет `docker compose build backend`
и `docker compose up -d --no-deps backend`, обе команды сначала парсят проект и упали бы —
причём **после** `git pull`, оставив хост с новым кодом и старым контейнером.

**Доведено до рабочего вида по запросу владельца** (единственная правка кода за аудит):
удалены блок `depends_on:` и секция `volumes:`. Структурная валидация проходит:

```
$ docker compose config          # с подменой host-пути env на заглушку
exit=0
```

Локально `docker compose config` по-прежнему сообщает про отсутствующий
`/opt/tada/.env` — это путь на VPS, на хостах он есть; к структуре претензий нет.

**Остаточная чистка** (в Фазе 3.2, уже не блокер): убрать `REDIS_HOST/PORT/PASSWORD/DB`
из `.env.production` и из `/opt/tada/.env` на хостах; удалить на хостах осиротевший
том `redis_data` и контейнер `tada-redis`.

---

## Принятые решения владельца (2026-07-28)

Эти решения — входные данные для плана, не предмет обсуждения.

1. **Operator-функционал сносится**, кроме роли `operator` и admin-CRUD операторов
   (нужны для линковки зданий). Полноценный интерфейс оператора — позже.
   Детали объёма — `05`, Фаза 2А.
2. **Инфраструктура:** доступ к stage и prod (VPS Hetzner) есть. Фактические
   nginx/compose-конфиги снимаются с боевых хостов и фиксируются как источник
   истины — `05`, Фаза 3.1.
3. **Redis не нужен** — решение в силе. Из кода удалён на `develop` (PR #44).
   Обоснование: в аутентификации Redis не участвует (cookie + JWT с `refresh_token_hash`
   в БД), кэша на нём нет.
   ⚠️ **Из `docker-compose.yml` пока НЕ удалён:** ветка `chore/remove-redis-compose`
   была удалена без мержа. Сервис, том `redis_data` и `depends_on` остаются в `develop`.
   Удаление + `REDIS_*` в env + артефакты на хостах — всё в Фазе 3.2.
4. **Архитектура фронта: App Router native.** Решение принято. FSD не возвращаем.
   `frontend/README.md` считается устаревшим документом.
5. **20+ старых веток рефакторинга в remote игнорируются.** Не мержим, не разбираем.
   Работаем от `develop` по новому флоу.
6. **У роли `operator` нет и не будет фронтового флоу.** Квартиры создаются из админки.
   Operator-UI сносится целиком, **редирект-таргет для этой роли не нужен** —
   открытый вопрос В1 закрыт. В модели данных роль и admin-CRUD операторов
   **сохраняются**: они нужны для линковки зданий к операторам.

**Базовая ветка всех дальнейших работ — `develop`.** Поток:
`develop` → фича-ветка → PR в `develop` (stage) → релиз в `main` (prod).

---

## Инвентаризация `.md` и решение по каждому файлу (2026-07-28)

Полный обход: `git ls-files "*.md"` (11 файлов) + непроиндексированные (6 файлов
`docs/audit/`). Итого 17 `.md` на момент инвентаризации. Разложены на три корзины.

### Корзина 1 — авторитетные (источник истины, остаются)

| Файл | Роль |
|---|---|
| `docs/audit/00-revision-note.md` | Ревизия против `develop`, решения владельца, эта инвентаризация |
| `docs/audit/01-overview.md` | Топология и инфраструктура |
| `docs/audit/02-backend-map.md` | Бэкенд: модули, энтити, БД |
| `docs/audit/03-frontend-map.md` | Фронтенд: структура, мёртвый код, слой данных |
| `docs/audit/04-docs-diff.md` | Документация vs реальность |
| `docs/audit/05-refactoring-plan.md` | План рефакторинга, фазы 0–7 |
| `docs/audit/PROGRESS.md` | **Создан 2026-07-28.** Живой трекер, 46 шагов, 1:1 с планом |

### Корзина 2 — операционные (полезные, остаются на месте)

| Файл | Почему остаётся |
|---|---|
| `CLAUDE.md` (корень) | **Создан 2026-07-28.** Единая точка входа для агента |
| `docs/archive/README.md` | **Создан 2026-07-28.** Объясняет назначение архива |
| `frontend/src/app/api/send-demo-request/README.md` | Инструкция по EmailJS. Маршрут живой, содержимое актуально. Единственная претензия — Service/Template ID в тексте, но это не секреты |

### Корзина 3 — вводящие в заблуждение / исторические (перенесены в `docs/archive/`)

Все перенесены через `git mv` — история сохранена. В начало каждого добавлен баннер
«⚠️ ИСТОРИЧЕСКИЙ ДОКУМЕНТ».

| Было | Стало | Почему |
|---|---|---|
| `frontend/README.md` | `docs/archive/frontend-README.md` | 14 расхождений с кодом (`04-docs-diff.md` §2): заявлен отменённый FSD, несуществующие слои `processes/`/`pages/`, несуществующие test-скрипты, «strict mode, no any» при `strict: false` и 178 `any`, пример `api.auth.login()` при отсутствующем маршруте |
| `frontend/src/pages/README.md` | `docs/archive/frontend-src-pages-README.md` | Описывает FSD-слой, который никогда не был реализован; директория содержала только этот файл |
| `docs/superpowers/plans/2026-03-28-auth-refactor.md` | `docs/archive/2026-03-28-auth-refactor-plan.md` | Выполнен частично; устаревшие пути и «Next.js 14» при фактическом 16 |
| `docs/superpowers/specs/2026-03-28-auth-refactor-design.md` | `docs/archive/2026-03-28-auth-refactor-design.md` | Опирается на Redis-сессии, которых больше нет |
| `docs/superpowers/plans/2026-04-11-frontend-refactoring.md` | `docs/archive/2026-04-11-frontend-refactoring-plan.md` | Брошен на этапе каркаса; **именно он породил осиротевший `src/components/`** |
| `docs/superpowers/specs/2026-04-11-frontend-refactoring-design.md` | `docs/archive/2026-04-11-frontend-refactoring-design.md` | То же |
| `frontend/docs/superpowers/plans/2026-04-01-property-amenities.md` | `docs/archive/2026-04-01-property-amenities-plan.md` | Фича **реализована** (`property_amenities` в энтити, миграция применена) — план исчерпан. Отдельно: его File Map предписывал класть миграцию в `backend/database/` — устаревшую папку, содержимое которой не применяется. Вероятный первоисточник R21 |
| `frontend/docs/superpowers/specs/2026-04-01-property-amenities-design.md` | `docs/archive/2026-04-01-property-amenities-design.md` | То же |
| `frontend/src/app/components/onboarding/ONBOARDING_PHONE_UPDATE.md` | `docs/archive/ONBOARDING_PHONE_UPDATE.md` | Changelog-фрагмент про `OnboardingProfileStep.tsx` — мёртвый компонент (0 импортов) |
| `frontend/src/app/components/onboarding/ONBOARDING_SAVE_BUTTON_UPDATE.md` | `docs/archive/ONBOARDING_SAVE_BUTTON_UPDATE.md` | То же |

**Итого перенесено: 10 файлов.** Ничего не удалено — часть из них штатно
сносится в Фазе 2 плана вместе с соответствующим кодом; тогда их можно убрать и из архива.

Побочный эффект переноса: директории `docs/superpowers/`, `frontend/docs/` и
`frontend/src/pages/` остались физически пустыми — git их не отслеживает.
Удаление пустой `frontend/src/pages/` запланировано шагом 2.6 (имя конфликтует
по смыслу с Pages Router в проекте на App Router).

### Отдельно — агент-конфиг

`.cursor/rules/tada-frontend.mdc` (`alwaysApply: true`) **противоречил принятому
решению об архитектуре**: предписывал «identify what can be moved to
entities/features/widgets/shared» и «extract into entities/_ or shared/_», то есть
активно толкал агента обратно в FSD. Также заявлял стек как «Next.js (App/Pages router)»,
хотя Pages Router не используется. Приведён в соответствие с решением
«App Router native» и снабжён ссылкой на `CLAUDE.md` и `docs/audit/`.
