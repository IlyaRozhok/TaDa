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
2. **Schema changes ride on green e2e and a rehearsed backup.** Risky DB work
   (migrations touching data, constraint changes on live tables) needs the CI
   e2e suite green and, for production, the backup installed and a restore
   rehearsed (`docs/ops/BACKUP_RUNBOOK.md`).
3. **Не меняем код и доки за пределами текущей согласованной задачи.**
   Заметил проблему вне scope — запиши в `docs/STATUS.md` («Open follow-ups»),
   не чини походя.

## Код-стиль: обязательная гигиена каждого шага

Два правила применяются к **каждому** изменённому файлу, в любом шаге рефакторинга.
Владелец читает диффы построчно — нарушение возвращается на доработку.

### 1. Убирать импорты, ставшие неиспользуемыми

После любой правки проверить, не осиротел ли импорт. Удалил использование символа —
удали и его импорт. То же касается неиспользуемых зависимостей в конструкторе
Nest-сервиса и мёртвых параметров метода.

The linter helps but does not fully gate this: CI runs `npm run lint` for both
apps and errors fail the build. On the **backend** `no-unused-vars` is an
**error**; on the **frontend** it is a `warn` (≈120 pre-existing hits form the
backlog), so there the orphaned-import rule is still enforced by review, not
by the machine. Unused constructor dependencies in Nest services are the case
ESLint misses everywhere (parameter properties count as "used") — check those
by eye.

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
| `@/lib/*` · `@/types/*` · `@/store/*` · `@/constants/*` | одноимённые папки в `./src/` | `@/store/slices/authSlice` |

(`@/components`, `@/hooks`, `@/utils` были удалены 2026-08-21 — их целевые
папки не существуют; компоненты живут в `src/app/components` и доступны
через `@/app/components/...`.)

**Что остаётся относительным:** импорты из той же директории (`./user.mapper`,
`./dto/update-user.dto`) — их не трогаем, `./` читается нормально.
Правило про алиас касается только выхода вверх по дереву — `../`, `../../` и глубже.

**Не устраивать массовую замену путей по всему репозиторию** — это отдельная задача,
не часть текущего шага. Правим только те импорты, что уже в диффе шага.

### 3. Где граница уборки

**Гигиену на строках, которые и так трогаешь, делаем сразу:** мёртвые импорты,
алиасы, явно мёртвый код рядом.
**Улучшение реализации методов, реструктуризацию, дедупликацию — не делаем
оппортунистически:** это отдельная задача со своим PR.
Заметил кандидата — пиши строку в `docs/STATUS.md` («Open follow-ups»),
а не переписывай заодно.

## Как ориентироваться

**`docs/STATUS.md` is the live document — read it first.** One screen: current
state, open follow-ups, host actions. It replaced `PROGRESS.md` (owner
decision 2026-08-21); the campaign's full decision log is preserved at
`docs/archive/PROGRESS-refactoring-2026-07-08.md`.

The rest of the docs tree:

| File | What it is |
|---|---|
| `docs/STATUS.md` | **The live doc.** State, follow-ups, host actions |
| `docs/audit/00`–`05` | Historical audit snapshots of 2026-07-28 (each carries a staleness banner). Useful as maps of the terrain, wrong about current state |
| `docs/audit/LAUNCH_PLAN.md` | The launch bar (backup, deploy order, prod lag). Item numbers are referenced from code comments (`deploy.yml`, `app.controller.ts`) |
| `docs/ops/BACKUP_RUNBOOK.md` | DB backup/restore: design, install, verify, restore drill |
| `docs/archive/` | Frozen history, including the refactoring PROGRESS log. Never a source of current truth |
| `.cursor/rules/tada-frontend.mdc` | Cursor rules — explicitly subordinate to this file |

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
2. Прочитать docs/STATUS.md — текущее состояние, follow-ups, host actions
3. Сделать ОДНУ связную задачу
4. Если после PR остаётся follow-up, решение или host action — записать
   в docs/STATUS.md
5. Открыть PR в develop
```

Одна задача = один PR, если владелец явно не связал несколько в пакет.
Это не бюрократия: половина находок аудита 2026 года — следствие того, что
рефакторинги делались крупными кусками и бросались на середине.

## Открытые вопросы

**None — all three former blockers are closed** (details in the archived
PROGRESS log, `docs/archive/PROGRESS-refactoring-2026-07-08.md`):

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
the chain does not replay from an empty database and carries a duplicate
timestamp (see `docs/STATUS.md`, «Open follow-ups»); fresh environments use
`TYPEORM_SYNCHRONIZE=true` until that is repaired.
