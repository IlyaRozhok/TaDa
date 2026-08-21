# CLAUDE.md — точка входа для агента

## Что за проект

TaDa — платформа аренды жилья. Два независимых приложения в одном репозитории
(**не монорепо**, корневого `package.json` нет): `backend/` — Nest.js 10 + PostgreSQL +
TypeORM 0.3, деплоится в Docker на VPS (Hetzner) за nginx; `frontend/` — Next.js 16
(App Router) + React 19 + Redux Toolkit + Tailwind v4, деплоится на Vercel.
Аутентификация — только Google OAuth, httpOnly-cookie + JWT с ротацией refresh-токена.
Прод — **ta-da.co** (ветка `main`), стейдж — **stage.ta-da.co** (ветка `develop`).

## Рабочий флоу

```
develop (stage)  →  main (prod)
```

Любая задача: **ветка от `develop` → PR в `develop` → проверка на stage → релиз в `main`**.

- Базовая ветка всегда `develop`. Никогда не коммить напрямую в `main`.
- **Старые ветки рефакторинга в remote НЕ мержим и не разбираем.** Их там 20+,
  все брошены; из них ничего не подтягиваем.
- **Язык — см. отдельное правило ниже.** Коротко: всё, что попадает в репозиторий,
  пишем по-английски; по-русски только общаемся в чате.

## Язык

**Всё, что попадает в репозиторий, — на английском.** Русский остаётся только
для общения в чате.

| Где | Язык |
|---|---|
| Комментарии в коде, JSDoc, имена в коде | English |
| Сообщения коммитов, заголовки и тела PR | English |
| Документация: `README.md`, `docs/**`, `CLAUDE.md` | English |
| Комментарии в `.env.example`, конфигах, workflow | English |
| Тексты в тестах: названия `describe`/`it`, комментарии | English |
| Обсуждение с владельцем | Русский |

Причина та же, что была для коммитов: репозиторий читает не только владелец —
подрядчики, будущие разработчики, инструменты. Смешанный язык в одном файле
хуже любого из двух.

**Правило действует вперёд. Решение владельца (2026-07-31): вариант «по мере».**
Массового перевода не делаем — ни `docs/audit/`, ни этого файла, ни уже смерженных
комментариев в коде. Но правишь файл — приводи **затронутые** строки к английскому,
по тому же принципу, что и с импортами (см. «Где граница уборки»).
Отдельной задачи на перевод в плане нет и не заводим.

## Железные правила

1. **Работающий функционал священен.** Ничего не должно сломаться. Если изменение
   может затронуть поведение — сначала скажи об этом, потом делай.
2. **Идём строго по фазам плана.** Фазу не начинаем, пока не закрыта предыдущая.
   Порядок и жёсткие зависимости — в `docs/audit/05-refactoring-plan.md`.
3. **🔴-шаги не начинаем без зелёных e2e.** Легенда риска: 🟢 безопасно ·
   🟡 нужна проверка на stage · 🔴 требует сетки тестов заранее.
4. **Не меняем код и доки за пределами текущего согласованного шага.**
   Заметил проблему вне scope — запиши в план или в заметку шага, не чини походя.

## Код-стиль: обязательная гигиена каждого шага

Два правила применяются к **каждому** изменённому файлу, в любом шаге рефакторинга.
Владелец читает диффы построчно — нарушение возвращается на доработку.

### 1. Убирать импорты, ставшие неиспользуемыми

После любой правки проверить, не осиротел ли импорт. Удалил использование символа —
удали и его импорт. То же касается неиспользуемых зависимостей в конструкторе
Nest-сервиса и мёртвых параметров метода.

The linter now catches this and CI gates on it: both apps have ESLint flat
configs (`backend/eslint.config.mjs`, `frontend/eslint.config.mjs`) with
`no-unused-vars` as an **error**, and `deploy.yml` runs `npm run lint` for both.
Unused constructor dependencies in Nest services are the one case ESLint still
misses (parameter properties count as "used") — check those by eye.

### 2. Импортировать через path-алиас, а не относительным путём

Алиасы уже настроены в обоих приложениях, но в коде почти везде остались `../../`.
При правке файла переводить на алиас **затронутые** импорты.

**Backend** — `backend/tsconfig.json`, `baseUrl: "./"`:

| Алиас | Куда ведёт | Пример |
|---|---|---|
| `@/*` | `src/*` | `@/entities`, `@/app.module` |
| `@/common/*` | `src/common/*` | `@/common/guards/jwt-auth.guard` |
| `@/database/*` | `src/database/*` | `@/database/data-source` |
| `@/entities/*` | `src/entities/*` | `@/entities/user.entity` |
| `@/modules/*` | `src/modules/*` | `@/modules/users/users.service` |

Резолвится в рантайме: `npm run build` = `tsc && tsc-alias`, `tsc-alias` переписывает
алиасы в относительные пути в `dist/`. В тестах — через `moduleNameMapper` в `jest.config.ts`.

⚠️ **Баррель `@/entities` реэкспортирует только классы энтити, не enum'ы.**
`UserRole`, `UserStatus`, `BookingRequestStatus` и т.п. импортировать из конкретного
файла: `@/entities/user.entity`.

**Frontend** — `frontend/tsconfig.json`, `baseUrl` не задан, пути от корня приложения:

| Алиас | Куда ведёт | Пример |
|---|---|---|
| `@/*` | `./src/*` | `@/app/types`, `@/app/lib/api` |
| `@/components/*` · `@/lib/*` · `@/types/*` · `@/hooks/*` · `@/utils/*` · `@/store/*` · `@/constants/*` | одноимённые папки в `./src/` | `@/store/slices/authSlice` |

**Что остаётся относительным:** импорты из той же директории (`./user.mapper`,
`./dto/update-user.dto`) — их не трогаем, `./` читается нормально.
Правило про алиас касается только выхода вверх по дереву — `../`, `../../` и глубже.

**Не устраивать массовую замену путей по всему репозиторию** — это отдельная задача,
не часть текущего шага. Правим только те импорты, что уже в диффе шага.

### 3. Где граница уборки

**Гигиену на строках, которые и так трогаешь, делаем сразу:** мёртвые импорты,
алиасы, явно мёртвый код рядом.
**Улучшение реализации методов, реструктуризацию, дедупликацию — не делаем
оппортунистически:** это откладывается в фазу, которая владеет файлом, и только
после поднятой тестовой сетки (Фаза 1).
Заметил кандидата — пиши строку в `docs/audit/PROGRESS.md`, секция
«Замечено по ходу», а не переписывай заодно.

## Как ориентироваться

**`docs/audit/` is the single source of truth — with one precedence rule:
the maps `01`–`05` are a snapshot of 2026-07-28 and only `PROGRESS.md` corrects
them.** Where a map and PROGRESS.md disagree, PROGRESS.md wins. Nine documents,
plus the ops runbook:

| File | What it is |
|---|---|
| `00-revision-note.md` | Audit revision against `develop`, owner decisions, `.md` inventory |
| `01-overview.md` | Repo topology, infrastructure, CI/CD (snapshot — see PROGRESS for fixes since) |
| `02-backend-map.md` | Backend modules and cycles, entities, DB/migrations state (snapshot; the `notifications` module postdates it) |
| `03-frontend-map.md` | Frontend architectures, dead code, data layer (snapshot) |
| `04-docs-diff.md` | "Documentation vs reality" discrepancies |
| `05-refactoring-plan.md` | **The main plan.** Risk register, phases 0–7, per-step risk |
| `PROGRESS.md` | **Live tracker and decision log — read this first.** Includes «Bugfixes outside the phase numbering» for work outside the phases |
| `LAUNCH_PLAN.md` | The launch bar: what blocks going live (backup, deploy order, prod lag) |
| `REFACTORING_STATUS.md` | Point-in-time stakeholder snapshot (2026-08-06) — do **not** use for current state |
| `../ops/BACKUP_RUNBOOK.md` | DB backup/restore: design, install, verify, restore drill |

**`docs/archive/` — исторические файлы. Игнорировать.** Там лежат отменённые планы
и README, описывающий несуществующую архитектуру. Не выполнять, не цитировать,
не использовать как руководство.

Отдельно: **архитектура фронта — App Router native.** FSD (`features/`, `entities/`,
`widgets/`, `shared/`) не возвращаем, она отменена решением владельца.

## Порядок работы агента

```
0. Fresh checkout? Run scripts/setup.sh (installs deps for both apps).
   Claude Code on the web does this automatically via .claude/hooks/session-start.sh.
1. Прочитать CLAUDE.md (этот файл)
2. Прочитать docs/audit/PROGRESS.md → определить текущий шаг
3. Прочитать соответствующий раздел docs/audit/05-refactoring-plan.md
4. Сделать ОДИН шаг — не больше
5. Обновить PROGRESS.md (статус, PR, дата, заметка)
6. Открыть PR в develop
```

Один шаг = один PR. Это не бюрократия: половина находок аудита — следствие того,
что предыдущие рефакторинги делались крупными кусками и бросались на середине.

Work that is not a plan step — a production bug, a security fix, a feature the
owner asked for directly — does not force itself into the phase numbering:
record it in PROGRESS.md under «Bugfixes outside the phase numbering» instead,
still one branch and one PR per item unless the owner explicitly bundles them.

## Открытые вопросы

**None — all three former blockers are closed** (details in PROGRESS.md):

- **Q2 closed 2026-07-28**: SF Pro stays; Tailwind fixed via CSS-first `@theme` tokens (step 4.1).
- **Q3 closed 2026-07-29** (step 0.3): migrations reconciled on both hosts, `pending = 0`.
- **Q4 closed 2026-08-06** (step 3.1): compose on both hosts is byte-identical to the
  repo; nginx is host-managed (Certbot) and proxies to **3001** — port 3002 never
  existed anywhere but in a dead repo file. `nginx/*.conf` are reference mirrors.

## Чего делать нельзя

- Коммитить в `main` напрямую.
- Править `frontend/src/translations/*` — ими управляет Localazy, правки затрутся.
- Начинать 🔴-шаг без зелёных e2e.
- Чинить что-то «заодно», вне текущего шага.

Migrations live in `backend/src/database/migrations/` — nowhere else. Note:
the chain does not replay from an empty database (see PROGRESS.md «Noticed
along the way» 2026-08-18); fresh environments use `TYPEORM_SYNCHRONIZE=true`
until that is repaired.
