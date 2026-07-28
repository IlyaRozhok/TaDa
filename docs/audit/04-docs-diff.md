# 04 — Документация vs реальность

Инвентаризация всех `.md` в репозитории (исключая `node_modules` и `.terraform`)
и построчная сверка с кодом. **Пересверено против `develop`** —
см. [`00-revision-note.md`](./00-revision-note.md).

> ## Принятые решения (2026-07-28) — статус документов
>
> - **`frontend/README.md` официально признан устаревшим.** Архитектура фронта —
>   **App Router native**; FSD не возвращаем. README подлежит переписыванию
>   (`05`, Фаза 1.5), до тех пор по нему не работать.
> - **Планы `docs/superpowers/plans/*` и specs — исторические.** Не брать в работу.
> - **Старые ветки рефакторинга в remote игнорируются**, ничего оттуда не подтягиваем.
> - Базовая ветка работ — **`develop`**.
>
> Часть расхождений первого прохода **уже устранена на `develop`** — отмечено ниже
> пометкой ✅.

---

## 1. Что вообще есть

| Файл | Строк | Тип |
|---|---|---|
| `frontend/README.md` | 277 | Основная документация фронта |
| `frontend/src/pages/README.md` | ~30 | Описание FSD-слоя `pages` |
| `frontend/src/app/api/send-demo-request/README.md` | ~60 | Инструкция по EmailJS |
| `frontend/src/app/components/onboarding/ONBOARDING_PHONE_UPDATE.md` | — | Changelog-фрагмент |
| `frontend/src/app/components/onboarding/ONBOARDING_SAVE_BUTTON_UPDATE.md` | — | Changelog-фрагмент |
| `docs/superpowers/specs/2026-03-28-auth-refactor-design.md` | 130 | Дизайн-док |
| `docs/superpowers/plans/2026-03-28-auth-refactor.md` | 907 | План рефакторинга |
| `docs/superpowers/specs/2026-04-11-frontend-refactoring-design.md` | 336 | Дизайн-док |
| `docs/superpowers/plans/2026-04-11-frontend-refactoring.md` | 2220 | План рефакторинга |
| `frontend/docs/superpowers/{plans,specs}/2026-04-01-property-amenities*.md` | — | План + дизайн |

**Чего нет вообще:**
- Корневого `README.md` — новый разработчик не знает, с чего начать.
- Любой документации бэкенда: ни README, ни описания модулей, ни ER-диаграммы,
  ни описания домена (что такое matching, как считается score, что за 11 статусов booking).
- `ARCHITECTURE.md`.
- `.env.example` (формально не `.md`, но это ключевой документ онбординга).
- Описания процесса деплоя и релизов (ветки, домены, что куда едет).
- Runbook: что делать, если упал прод; как откатить миграцию.

---

## 2. `frontend/README.md` — расхождения

Это главный документ фронтенда и он описывает **не то приложение, которое существует**.

| № | Утверждение README | Реальность | Серьёзность |
|---|---|---|---|
| 1 | «follows **Feature-Sliced Design**» | FSD внедрён частично и **отменён**: сначала решением от 2026-04-11 (`specs/2026-04-11-...md`: «Decision: Abandon FSD»), теперь подтверждено владельцем — целевая архитектура **App Router native**. Живут три архитектуры одновременно. | Высокая |
| 2 | В структуре указан слой `processes/` | Директории `src/processes/` **не существует** | Средняя |
| 3 | В структуре указан слой `pages/` | `src/pages/` содержит **только README.md**, ноль файлов кода | Средняя |
| 4 | «Layer Rules: shared → no dependencies on other layers» | `src/shared/api/client/index.ts` импортирует `@/app/lib/api` — `shared` зависит от `app`, прямое нарушение заявленного правила | Высокая |
| 5 | «**Centralized API layer**», «Type-safe endpoints», «Full TypeScript coverage» | Четыре параллельных механизма (axios / RTK Query / ручной fetch / shared-api-обёртка). `shared/api` — мёртвый barrel. Типобезопасности контракта нет. | Высокая |
| 6 | Пример: `api.auth.login({ email, password })` | Метода нет; **на бэкенде нет маршрута `/auth/login`** — вход только через Google OAuth. ✅ На `develop` мёртвый password-слой из фронта уже вырезан (PR #45), но README по-прежнему учит звать несуществующий метод | Высокая |
| 7 | «**Caching**: React Query integration» | React Query не установлен. Используется RTK Query. | Средняя |
| 8 | «Design Tokens … `import { colors, spacing, textStyles } from '@/shared/ui/tokens'`» | Файлы существуют, но это TS-объекты для inline-стилей, не связанные с Tailwind-темой. Единой дизайн-системы нет; директорий `ui` — три. | Средняя |
| 9 | Раздел Testing: `npm run test`, `npm run test:watch`, `npm run test:coverage` | **Ни одного из этих скриптов нет** в `frontend/package.json`. Реальные — `e2e`, `e2e:ui`, `e2e:report`. | Высокая |
| 10 | «**Strict mode enabled**: No `any` types allowed» | `tsconfig.json`: `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`. **178 вхождений `: any`**. | Высокая |
| 11 | «Explicit return types: For all functions» | Не соблюдается, правило не включено в ESLint | Низкая |
| 12 | Prerequisites: «Node.js 18+» | Docker-образ бэка — Node 20; Next.js 16 требует Node 18.18+ / рекомендует 20+. Формально не ложь, но вводит в заблуждение. | Низкая |
| 13 | «Performance: Virtual Scrolling, Memoization, Lazy Loading» с примерами импортов из `@/shared/lib/performance` | Модули существуют, но практически не используются в коде. Заявлено как работающая практика — по факту неиспользуемая инфраструктура. | Средняя |
| 14 | «Image Optimization: Next.js Image component» | `public/` — 38 МБ несжатых PNG (до 4.5 МБ на файл); `next.config.ts` оптимизирует только remote-паттерны | Средняя |

**Вывод по README:** документ аспирационный — описывает намерение, а не систему.
Для новичка он вреднее, чем его отсутствие: следуя ему, человек будет искать
несуществующие слои и звать несуществующие эндпоинты.

---

## 3. `frontend/src/pages/README.md`

Описывает структуру FSD-слоя `pages` с примерами (`home/`, `property-details/`, `dashboard/`)
и правилами импорта. **Ни одного из описанных каталогов не существует** —
в директории только сам README. Слой не был реализован никогда.

Файл существует лишь для того, чтобы `src/pages/` не была пустой. Это опасно вдвойне:
`src/pages/` — зарезервированное имя Pages Router в Next.js. Сейчас конфликта нет,
но директория с таким именем в проекте на App Router сбивает с толку.

---

## 4. `docs/superpowers/specs/2026-03-28-auth-refactor-design.md`

| Утверждение | Реальность |
|---|---|
| «Backend auth is correct: httpOnly cookies, **Redis sessions**, JWT strategy» | ✅ Redis-сессий **больше нет**: на `develop` `common/services/redis.module.ts` удалён, `ioredis` и `@types/ioredis` убраны из зависимостей (PR #44). Осталась cookie+JWT схема с `refresh_token_hash` в БД. Документ описывает несуществующий механизм. |
| «Three API clients (`api.ts`, `base-client.ts`, `apiSlice.ts`)» | `base-client.ts` действительно удалён (рефакторинг выполнен). Но появился четвёртый путь — ручные `fetch()` в `operatorSlice`/`shortlistSlice`. Проблема не решена, а переехала. |
| «RTK Query `apiSlice.ts` structure — stays» | Осталась, но с отключёнными `refetchOnMountOrArgChange/onFocus/onReconnect` |

Статус документа не проставлен. Судя по коду, **выполнен частично**.

---

## 5. `docs/superpowers/plans/2026-03-28-auth-refactor.md`

| Утверждение | Реальность |
|---|---|
| «Tech Stack: **Next.js 14**» | Установлен **Next.js 16.0.7** |
| File Map упоминает `frontend/src/app/store/slices/authSlice.ts` | Реальный путь — `frontend/src/store/slices/authSlice.ts` (без `app/`). Слайсы переехали, план не обновлён. |
| `frontend/src/shared/api/client/base-client.ts` → Delete | Выполнено — файла нет |
| `frontend/src/app/hooks/useAuth.ts` → Modify | ✅ На `develop` файл **удалён** (PR #45). План предписывал его править — правильным действием было удаление; это и произошло позже. |

---

## 6. `docs/superpowers/{specs,plans}/2026-04-11-frontend-refactoring*.md`

Самый важный для понимания текущего состояния документ. Дизайн заявляет:

> «**Decision: Abandon FSD.** Use Next.js App Router as the structural backbone…
> FSD folders (`features/`, `entities/`, `widgets/`, `shared/`) are absorbed into
> the new structure and deleted.»

Целевая структура: `src/components/ui|layout|property|admin`, единый RTK Query
в `src/lib/api.ts`, route-specific код в `app/app/[route]/_components/`.

**Что произошло на самом деле:**

| Пункт плана | Статус |
|---|---|
| Создать `src/components/` | Создано — и **осиротело** (22 файла, 0 импортов) |
| Создать `src/lib/api.ts` с единым RTK Query | Создан только пустой `src/lib/index.ts`; `api.ts` не появился |
| Удалить `features/`, `entities/`, `widgets/`, `shared/` | **Не удалены**, продолжают использоваться |
| Колокация в `_components/` | Не сделано ни в одном роуте |
| Убрать `"use client"` где можно | Не сделано: 145 из 230 `.tsx` — клиентские |
| Удалить неиспользуемые ассеты (38 МБ) | Не сделано — `public/` по-прежнему 38 МБ |

**Это и есть источник осиротевшего дерева `src/components/`.** План начали, создали
каркас копированием `shared/ui`, бросили — и копия осталась расходиться с оригиналом.

Важно для дальнейшей работы: **план 2026-04-11 нельзя брать в работу как есть.**
Он написан до текущего состояния, часть шагов уже выполнена в других ветках,
часть — устарела. Его следует пометить как исторический.

---

## 7. Changelog-фрагменты в дереве компонентов

`ONBOARDING_PHONE_UPDATE.md` и `ONBOARDING_SAVE_BUTTON_UPDATE.md` лежат в
`frontend/src/app/components/onboarding/`.

Оба подробно документируют изменения в `OnboardingProfileStep.tsx`
(«Added PhoneMaskInput to OnboardingProfileStep», «Removed Auto-Save Functionality»).

**`OnboardingProfileStep.tsx` — мёртвый файл** (0 импортов, подтверждено резолвером).
То есть это документация несуществующего поведения, живущая внутри исходников.
Место таких записей — git history или CHANGELOG, не дерево компонентов.

---

## 8. `frontend/src/app/api/send-demo-request/README.md`

Инструкция по настройке EmailJS. Претензий по актуальности нет — маршрут живой.

Замечание: документ содержит конкретные Service ID (`service_6pn9c83`) и
Template ID (`template_bgp9fyr`). Это не секреты в строгом смысле (EmailJS public key
по дизайну публичен), но идентификаторы интеграции в README — не лучшая практика.

---

## 9. Сводный список расхождений «документация vs реальность»

**Высокая серьёзность (вводит в заблуждение и приведёт к ошибке):**
1. README: заявлен FSD — принята **App Router native**, живут три архитектуры сразу.
2. README: `shared` не зависит от других слоёв — зависит от `app`.
3. README: «централизованный типобезопасный API» — четыре механизма, типобезопасности нет.
4. README: пример `api.auth.login()` — маршрута нет, вход только через Google
   (сам мёртвый вызов из фронта ✅ уже убран на `develop`, README — нет).
5. README: три test-скрипта — ни одного не существует.
6. README: «strict mode, no any» — strict выключен, 178 `any`.
7. auth-design: «Redis sessions» — ✅ Redis удалён полностью на `develop`; документ устарел.

**Средняя:**
8. README: слои `processes/` и `pages/` не существуют (второй — только README).
9. README: React Query — не установлен, используется RTK Query.
10. README: дизайн-токены как система — не связаны с Tailwind.
11. README: performance-утилиты как практика — не используются.
12. План 2026-04-11 описан как целевой — фактически брошен на этапе каркаса.

**Низкая:**
13. Устаревшие версии в планах (Next 14 vs 16), устаревшие пути к файлам.
14. Changelog-фрагменты про мёртвый компонент внутри `src/`.
15. EmailJS ID в README.

**Отсутствует полностью (главный пробел):**
16. Документация бэкенда — ноль. Домен matching (1941 строка логики скоринга)
    не описан нигде.
17. `.env.example`.
18. Описание деплоя, веток, доменов, процедуры отката.
19. Схема БД / ER-диаграмма.
