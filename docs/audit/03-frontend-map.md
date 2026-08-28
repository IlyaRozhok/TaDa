> **SNAPSHOT of 2026-07-28 — historical.** Describes the codebase as the audit
> found it; much of it has been fixed since (CI, notifications module,
> shortlist table, booking lifecycle, SEO, and more). The code and
> `docs/STATUS.md` are the current truth; the campaign's decision log is
> `docs/archive/PROGRESS-refactoring-2026-07-08.md`.

# 03 — Frontend: структура, дубли, мёртвый код, слой данных

> Next.js 16 (App Router), React 19, Redux Toolkit + RTK Query, Tailwind v4, TypeScript.
> 383 файла, ~69 800 строк.
>
> **Пересверено против `develop`.** Расхождения с первым проходом —
> в [`00-revision-note.md`](./00-revision-note.md). Ключевые правки этого документа:
> `app/hooks/useAuth.ts` удалён на `develop`; мёртвый password-слой API вырезан;
> подсчёт Tailwind-брейкпоинта `xs:` в первом проходе был ошибочным (§7).
>
> **Принято:** архитектура фронта — **App Router native**. FSD не возвращаем.

---

## 1. Главная проблема: три архитектуры одновременно

В `src/` сосуществуют три несовместимых способа организовать код. Ни один не доведён до конца.

### Архитектура A — App Router c «карманами» (ЖИВАЯ, ~80% кода)

```
src/app/
├── app/                    ← бизнес-роуты. Даёт URL вида /app/properties, /app/matches
│   ├── admin/panel/  auth/  buildings/[id]/  dashboard/{admin,operator}/
│   ├── matches/  onboarding/  preferences/  profile/
│   ├── properties/{[id],create,manage,map}/  operators/[id]/
│   ├── shortlist/  tenant-cv/  units/
├── components/             ← 60+ компонентов вперемешку (god-модалки, лендинг, ui/)
├── hooks/                  ← 11 хуков
├── lib/                    ← api.ts (591 стр.), utils, validation, geocoding
├── types/  utils/  contexts/  services/  styles/
├── page.tsx (лендинг)  privacy/  terms/  cv/[uuid]/  properties/[id]/
└── api/                    ← Next.js route handlers (emailjs, send-demo-request)
```

Замечание по маршрутизации: сегмент `src/app/app/` даёт публичные URL `/app/...`.
Внутри `app/` при этом есть **второй набор** страниц объекта: `src/app/properties/[id]/page.tsx`
(публичная) и `src/app/app/properties/[id]/page.tsx` (1739 строк, для залогиненных).
Плюс `src/app/properties/[id]/test/page.tsx` и `src/app/properties/[id]/test-page.tsx` —
тестовые страницы, доехавшие до прода.

### Архитектура B — Feature-Sliced Design (ЖИВАЯ ЧАСТИЧНО)

```
src/shared/    ui/ (13 компонентов), lib/, api/, hooks/, components/   ← 25 файлов импортируют @/shared/ui
src/entities/  preferences/model, property/ui, user/lib
src/features/  preferences/, profile/update-profile/, property/edit-property/, shortlist/
src/widgets/   admin/AdminPanel/hooks, property/
src/pages/     ← ТОЛЬКО README.md, ни одного файла кода
```

### Архитектура C — плоская «Next-native» (ПОЛНОСТЬЮ МЁРТВАЯ)

```
src/components/   22 файла — осиротевшая копия src/shared/ui   ← 0 импортов
src/lib/          только index.ts                              ← мёртв
src/types/        9 файлов, дублируют src/app/types            ← 6 импортов против 57
src/constants/    живой (mappings.ts 701 стр., admin-form-options.ts 449 стр.)
src/store/        живой — Redux store
```

**Почему так вышло:** в `docs/superpowers/plans/2026-04-11-frontend-refactoring.md` описан
план миграции «FSD → плоская структура»: создать `src/components/`, `src/lib/api.ts`,
перенести туда всё и удалить `features/entities/widgets/shared`. План начали — создали
каркас `src/components/` и `src/lib/`, скопировав туда `shared/ui` — и бросили.
Осиротевшее дерево `src/components/` — прямое следствие.

---

## 2. Мёртвый код — 41 файл (проверено резолвером импортов)

Метод: построены все `import`/`from`-спецификаторы, относительные и `@/`-алиасы разрешены
в реальные пути, исключены служебные файлы Next (`page`, `layout`, `route`, …).

### `src/components/` — 22 файла, 0 входящих импортов

Проверено отдельно: **ни один импорт во всём проекте не резолвится в `src/components/`**.

```
src/components/index.ts
src/components/ui/index.ts
src/components/ui/{Badge/FeaturedBadge, Button/Button, Card/Card, Container/Container,
  CountryDropdown/CountryDropdown, DateInput/{DateInput,StyledDateInput,index},
  FormField/FormField, Input/Input, Modal/ConfirmModal,
  PhoneMaskInput/{PhoneMaskInput,index}, Spinner/LoadingSpinner, Stack/Stack,
  Textarea/Textarea, tokens/{colors,index,spacing,typography}}
```

Это устаревшая копия `src/shared/ui/`. Файлы разошлись — `Button.tsx`,
`CountryDropdown.tsx`, `StyledDateInput.tsx`, `FormField.tsx`, `PhoneMaskInput.tsx`,
`tokens/typography.ts` и оба `index.ts` **отличаются** от версий в `shared/ui`.
В `shared/ui` есть `DetailsCard`, которого нет в копии. То есть это не просто дубль,
а форк, за которым легко ошибиться при правке.

### Остальные 19 мёртвых файлов

> Список пересканирован на `develop`. Итого по-прежнему **41 файл**, но состав изменился:
> `app/hooks/useAuth.ts` из него выбыл — он удалён из репозитория в PR #45.

```
src/app/components/GlobalLoader.tsx
src/app/components/ImageSlider.tsx
src/app/components/LifestyleFeatures.tsx
src/app/components/LoadingOverlay.tsx
src/app/components/OwnerPropertiesSection.tsx
src/app/components/PropertyBadges.tsx
src/app/components/PropertyContent.tsx
src/app/components/PropertyImage.tsx
src/app/components/PropertyMapGoogle.tsx
src/app/components/TenantPerfectMatchSection.tsx
src/app/components/onboarding/OnboardingProfileStep.tsx
src/app/components/onboarding/OnboardingStep.tsx
src/app/components/preferences/step-components/InputField.tsx
src/app/components/preferences/ui/{CustomDropdown,SearchableDropdown,index}.tsx
src/app/components/ui/{AuthMessage,FeaturedBadge,PhoneInputWithCountryCode,ShortlistPageSkeleton}.tsx
src/app/hooks/useShortlist.ts
src/app/lib/performance.ts
src/app/properties/[id]/test-page.tsx        ← тестовый артефакт
src/app/types/api.ts
src/features/profile/update-profile/ui/{ProfileForm,SimpleProfileForm}.tsx
src/shared/lib/__tests__/area.test.ts        ← ломает typecheck, см. §6
```
Плюс мёртвые barrel-файлы: `src/{constants,entities,features,lib,types,widgets}/index.ts`,
`src/entities/preferences/model/index.ts`, `src/features/property/edit-property/index.ts`,
`src/features/profile/update-profile/ui/components/index.ts`,
`src/shared/{index,api/index,api/hooks/index}.ts`.

Отдельно: `OnboardingProfileStep.tsx` мёртв, но два `.md`-файла рядом с ним
(`ONBOARDING_PHONE_UPDATE.md`, `ONBOARDING_SAVE_BUTTON_UPDATE.md`) подробно описывают
доработки именно этого компонента. Документация описывает мёртвый код.

---

## 3. Дубликаты

### 3.1 Хуки

| Функция | Реализации | Живые |
|---|---|---|
| Предпочтения | `app/hooks/usePreferences.ts` · `features/preferences/lib/usePreferences.ts` (762 стр.) | обе |
| Форма объекта | `app/hooks/usePropertyForm.ts` · `app/components/AddPropertyModal/hooks/usePropertyForm.ts` · `features/property/edit-property/lib/usePropertyForm.ts` | все три |
| Шортлист | `app/hooks/useShortlist.ts` (**мёртв**) · `features/shortlist/lib/useShortlist.ts` | одна |
| Авторизация | ~~`app/hooks/useAuth.ts`~~ — **удалён на `develop`** (PR #45) · `shared/api/hooks/use-auth.ts` (только в мёртвом barrel) | ни одной |
| Профиль | `shared/hooks/useUnifiedProfile.ts` · `shared/hooks/useUserProfile.ts` | обе |

### 3.2 Формы профиля — три реализации

`features/profile/update-profile/ui/`: `ProfileForm.tsx` (620 стр., **мёртв**),
`SimpleProfileForm.tsx` (**мёртв**), `UnifiedProfileForm.tsx` (живая).
Две из трёх — мёртвый груз, но по имени неочевидно, какая настоящая.

### 3.3 Типы — два параллельных дерева

| | Файлы | Импортов |
|---|---|---|
| `src/types/` | api, booking, building, common, index, preferences, property, tenantCv, user | 6 |
| `src/app/types/` | api (мёртв), bookingRequest, index, preferences, property, tenantCv | 57 |

`src/types/property.ts` — 176 строк / 11 экспортов, `src/app/types/property.ts` — 133 / 12.
Описывают одну и ту же доменную сущность разными полями. Победитель по факту — `app/types`.

### 3.4 UI-компоненты

`src/components/ui/*` (мёртв) vs `src/shared/ui/*` (жив) — см. §2.
Дополнительно `src/app/components/ui/` — третий набор (скелетоны, `ConfirmModal`,
`FormField`, `LoadingSpinner`, `PhoneInputWithCountryCode`), частично мёртвый.
Итого **три** директории с названием `ui`.

---

## 4. Раздутые файлы

| Файл | Строк |
|---|---|
| `app/components/EditPropertyModal.tsx` | **3057** |
| `app/components/EditBuildingModal.tsx` | **2454** |
| `app/components/AddBuildingModal.tsx` | **2186** |
| `app/app/properties/[id]/page.tsx` | 1739 |
| `app/app/admin/panel/page.tsx` | 1303 |
| `app/app/properties/create/page.tsx` | 1163 |
| `app/components/DualLandingWrapper.tsx` | 802 |
| `app/components/tenant-cv/TenantCvView.tsx` | 795 |
| `features/preferences/lib/usePreferences.ts` | 762 |
| `app/components/MediaManager.tsx` · `app/app/properties/page.tsx` | 727 |
| `app/app/matches/page.tsx` | 724 |
| `constants/mappings.ts` | 701 |

Три модалки — 7697 строк на троих — почти наверняка содержат общую логику формы
объекта/здания, размноженную копипастой. Это первый кандидат на извлечение
общей формы, но **только после того, как появятся e2e-тесты**: это самые
используемые экраны админки.

---

## 5. Слой данных — четыре параллельных механизма

### 5.1 Что есть

1. **Axios `src/app/lib/api.ts` (591 стр.) — доминирующий.**
   Один инстанс, `withCredentials: true`, response-interceptor на 401 → `dispatch(logout())`
   с исключениями для `/preferences`, `/auth`, `/onboarding`. Экспортирует объекты
   `authAPI`, `propertiesAPI`, `buildingsAPI`, `operatorAPI` и т.д.

2. **RTK Query `src/store/slices/apiSlice.ts`.**
   `createApi` + `fetchBaseQuery`, `credentials: "include"`, `tagTypes: [User, Property,
   Preferences, Shortlist]`, `keepUnusedDataFor: 300`. Покрывает ~8 эндпоинтов.
   `refetchOnMountOrArgChange/onFocus/onReconnect` — все `false`, то есть автоматическая
   инвалидация практически отключена.

3. **Ручные `fetch()` в thunk'ах.** `store/slices/operatorSlice.ts` (стр. 86, 123, 151),
   `shortlistSlice.ts` — свой `API_BASE_URL`, своя обработка ошибок, мимо интерсептора 401.

4. **`src/shared/api/`** — формально «централизованный слой», фактически
   `client/index.ts` просто ре-экспортирует `@/app/lib/api`, а `endpoints/auth.ts`
   бьёт в несуществующие маршруты (см. §5.3). Весь barrel `shared/api/index.ts` мёртв.

Итог: состояние сервера живёт одновременно в RTK Query кэше, в самописных redux-слайсах
и в локальном `useState` компонентов. Единого источника истины нет, инвалидация ручная.

### 5.2 Redux store

```ts
reducer: { api: apiSlice.reducer, auth, users, preferences, operator, shortlist }
```
`serializableCheck.ignoredActions` отключает проверку для 4 shortlist-действий
с комментарием «Temporarily ignore … while fixing serialization» — временное решение,
ставшее постоянным.

### 5.3 Дрейф контракта: фронт зовёт маршруты, которых на бэке нет

Сверены все 71 маршрут бэкенда со всеми вызовами фронта, с корректной нормализацией
параметров (`${id}` ↔ `:id`) и с учётом HTTP-метода.

> Пересчитано на `develop`. По сравнению с первым проходом **выбыли**
> `/auth/login`, `/auth/register`, `/auth/check-user`, `/auth/authenticate` —
> мёртвый password-слой вырезан в PR #45 (`AuthModal` → Google-only).
> **Добавился** ранее пропущенный `/operator/suggest-property`.

**Путь отсутствует на бэке полностью:**

| Вызов с фронта | Где |
|---|---|
| `GET/POST/PATCH/DELETE /residential-complexes*` (6 методов) — переименовано в `/buildings` | `app/lib/api.ts:152-161` |
| `GET /operator/dashboard` | `app/lib/api.ts:120`, `operatorSlice.ts:86` |
| `GET /operator/tenants` | `app/lib/api.ts:124`, `operatorSlice.ts:123` |
| `GET /operator/properties` | `app/lib/api.ts:122`, `operatorSlice.ts:151` |
| `POST /operator/suggest-property` | `operatorSlice.ts:185` |
| `POST /auth/forgot-password` | `shared/api/endpoints/auth.ts:40` |
| `POST /auth/reset-password` | `shared/api/endpoints/auth.ts:44` |
| `POST /auth/verify-email` | `shared/api/endpoints/auth.ts:48` |
| `POST /auth/resend-verification` | `shared/api/endpoints/auth.ts:52` |
| `GET /auth/temp-token/:token` | `app/lib/api.ts:61` |
| `PATCH /properties/:pid/media/:mid/primary` | `app/lib/api.ts` |

**Путь есть, но не тот метод** (в первом проходе часть этих строк была classified неверно):

| Вызов с фронта | Что реально есть на бэке |
|---|---|
| `GET /users/:id` | только `PUT`, `DELETE` |
| `PATCH /users/:id` | только `PUT`, `DELETE` |
| `PUT /properties/:pid/media/:mid` | только `DELETE` |

**Из них реально исполняется в проде:** блок `/operator/*`.
`useOperatorDashboard` (`app/components/hooks/useOperatorDashboard.ts`) диспатчит три thunk'а
через `Promise.allSettled`, и этот хук используют **две живые страницы**:
`app/app/dashboard/operator/page.tsx:133` и `app/app/dashboard/admin/operator/page.tsx:140`.

`Promise.allSettled` глотает ошибки — они уходят в `console.error` и всё. То есть
**дашборд оператора сейчас всегда грузит пустые данные, и это никак не заметно**,
кроме как в консоли браузера. Этот хук ещё и содержит 8 отладочных `console.log`
с эмодзи, которые едут в прод.

Остальные вызовы — мёртвый код, но их существование маскирует настоящую проблему:
понять, какие эндпоинты живые, из фронта невозможно.

### 5.4 Инвентаризация operator-функционала (под удаление)

По решению владельца operator-функционал сносится, **кроме роли и admin-CRUD операторов** —
они нужны для линковки зданий к операторам. Точная граница:

**🔴 УДАЛЯЕТСЯ**

| Что | Файл |
|---|---|
| Дашборд оператора | `app/app/dashboard/operator/page.tsx` (473 стр.) |
| Админский вид дашборда оператора | `app/app/dashboard/admin/operator/page.tsx` (484 стр.) |
| Redux-слайс | `store/slices/operatorSlice.ts` — 4 thunk'а, все зовут несуществующие `/operator/*` |
| Хук дашборда | `app/components/hooks/useOperatorDashboard.ts` (+8 отладочных `console.log`) |
| Хук предложения объекта | `app/components/hooks/useSuggestProperty.ts` — используется только двумя удаляемыми страницами |
| `operatorAPI` | блок в `app/lib/api.ts:118-126` |
| Регистрация слайса | `store/store.ts` — ключ `operator` |
| Пункт меню | `app/components/DashboardHeader.tsx:291` → `/app/dashboard/admin/operator` |

**🟢 ОСТАЁТСЯ**

| Что | Почему |
|---|---|
| `UserRole.Operator` | роль нужна для модели |
| `OperatorProfile` (энтити + миграции) | линковка зданий |
| Admin-CRUD операторов: `AddUserModal`, `EditUserModal`, `AdminUsersSection` | создание операторов в админке |
| `GET /api/buildings/operators` (admin) | выбор оператора при создании здания |
| `Building.operator`, `Property.operator` | связи в модели |
| `@Roles(UserRole.Admin, UserRole.Operator)` на 8 маршрутах `property.controller.ts` | оставить как есть — роль живёт |
| **`app/app/operators/[id]/page.tsx`** | **публичная страница оператора, обращённая к арендатору.** Не дашборд. Живая: на неё ведут 4 ссылки из `BuildingPropertiesSection.tsx`, который используется в `app/app/properties/[id]/page.tsx:1508`. Работает через существующий `GET /properties/public/all`. Отдельный дефект: тянет **все** объекты и фильтрует по оператору в браузере — на объёме это станет проблемой, но это не повод удалять страницу. |

**⚠️ Побочный эффект, который нельзя пропустить.** Роль `operator` сейчас маршрутизируется
на удаляемую страницу в двух местах:
- `app/app/dashboard/page.tsx:45-47` — `case "operator": router.replace("/app/dashboard/operator")`
- `app/utils/simpleRedirect.ts:60-61` — `case "operator": return "/app/dashboard/operator"`

Плюс `app/components/SimpleDashboardRouter.tsx:87` содержит правило
`(requiredRole === "admin" && userRole === "operator")` — оператор пускается на админские
экраны. Если удалить целевую страницу, не поправив редиректы, **пользователь с ролью
`operator` после логина попадёт на 404**.

> **Решение владельца (2026-07-28):** у роли `operator` **нет фронтового флоу** —
> квартиры создаются из админки. Новую страницу-цель **не заводим**, редирект-таргет
> не нужен. Ветки `case "operator"` убираются. Куда роль проваливается по `default`
> и почему в `simpleRedirect.ts` этого недостаточно — разобрано в `05`, Фаза 2А.2.

**Дополнительно проверено на `develop`** (важно для оценки объёма работ):
- **онбординг больше не предлагает выбор роли** — в `app/app/onboarding/page.tsx`
  нет ни одного упоминания `operator`;
- `authAPI.updateUserRole` (`app/lib/api.ts:42-43`) — **определён, но не вызывается
  нигде**; это мёртвый метод, а не живой путь смены роли;
- оставшиеся `role: "operator"` в `EditPropertyModal.tsx` и `EditBuildingModal.tsx` —
  это **выбор оператора в админке для линковки**, они остаются.

Практический вывод: пользователей, которые получают роль `operator` через UI, больше нет.
Роль присваивается только админом. Это снижает риск сноса operator-UI до 🟡.

---

## 6. TypeScript и качество

`frontend/tsconfig.json`:
```jsonc
"strict": false,
"noImplicitAny": false,
"strictNullChecks": false,   // ← отключено
```
При этом `next.config.ts` содержит `typescript: { ignoreBuildErrors: false }`
с комментарием «Strict TypeScript checking enabled» — комментарий вводит в заблуждение:
билд падает на ошибках, но сами правила почти выключены.

`npx tsc --noEmit` → **ровно одна ошибка**:
```
src/shared/lib/__tests__/area.test.ts(1,38): error TS2307: Cannot find module 'vitest'
```
Это единственный unit-тест фронта, написанный под vitest, который не установлен
и не настроен. Он ломает `npm run type-check` и `npm run quality`.

Прочее:
- `: any` — **178** вхождений.
- `console.*` — **430** вхождений (на `develop`; в первом проходе 427).
- Два конфига ESLint: `eslint.config.mjs` (flat, активный, только `next/core-web-vitals`
  + `next/typescript`) и `.eslintrc.json` + `.eslintrc.strict.json` (legacy, игнорируются).
  Правила из `.eslintrc.json` (`no-unused-vars`, `no-explicit-any`, `jsx-key`) **не применяются**.
- Общих типов с бэкендом нет: DTO переписаны руками, генерации клиента из Swagger нет,
  хотя Swagger-схема на бэке есть.

---

## 7. Tailwind — конфиг полностью игнорируется

Проект на **Tailwind v4** (`@tailwindcss/postcss`, `tailwindcss: ^4`).
`src/app/globals.css` начинается с `@import "tailwindcss";` и **не содержит директивы
`@config`**. В v4 JS-конфиг подключается только явной директивой `@config`.

Следовательно `frontend/tailwind.config.ts` (весь `theme.extend`) не читается.

**Проверено эмпирически** — прогон Tailwind CLI на пробном файле:

| | без `@config` | с `@config` |
|---|---|---|
| `font-sf-pro` | CSS не сгенерирован | `SF Pro …` присутствует |
| `min-h-touch` | не сгенерирован | присутствует |
| `xs:block` | не сгенерирован | присутствует |

Что фактически не работает в коде (**пересчитано на `develop`**):

| Токен | Использований | Где |
|---|---|---|
| `font-sf-pro` | **20** в 9 файлах | реальные `className`, фирменный шрифт не применяется — заметно глазом |
| `min-h-touch-sm` | 2 | `app/components/UniversalHeader.tsx:48,54` |
| `p-0.75` (кастомный spacing) | 2 | там же |
| `xs:` брейкпоинт (475px) | **0** | см. поправку ниже |
| `max-w-mobile/tablet/desktop` | 0 | |
| кастомные `borderRadius`, `fontSize` | перекрываются дефолтами Tailwind | эффект незаметен |

> **Поправка к первому проходу.** Заявленные «14 использований `xs:`» — ошибка:
> grep по подстроке `xs:` ловил ключи TS-объектов (`xs: "px-2 py-1 text-xs"` в
> `shared/ui/Button.tsx`, `xs:` в `tokens/spacing.ts` и `typography.ts`), а не
> Tailwind-префикс. Точный поиск `\bxs:[a-z-]+` даёт **ноль**. Брейкпоинт `xs`
> не используется нигде.

Практический вывод: реальный видимый ущерб от игнорируемого конфига — **только `font-sf-pro`**
(20 мест, 9 файлов) и два узла в шапке. Это меньше, чем оценивалось в первом проходе,
и делает исправление заметно менее рискованным.

Дополнительно `content`-глобы в конфиге перечисляют только
`src/pages/**`, `src/components/**`, `src/app/**` — то есть не покрывают
`src/shared`, `src/features`, `src/entities`, `src/widgets`. Сейчас это неважно
(конфиг не читается), но станет важно в момент подключения `@config`.

**Осторожно при исправлении:** просто добавить `@config` — не безопасно. Классы, которые
сейчас молча не работают, начнут работать, и типографика изменится на ~9 файлах
(включая лендинг). Это не «починка», а визуальное изменение. Порядок действий — в `05`, Фаза 4.1.

Дизайн-токенов как системы нет: `shared/ui/tokens/{colors,spacing,typography}.ts`
существуют, но это TS-объекты для inline-стилей, не связанные с Tailwind-темой.

---

## 8. Рендеринг и производительность

- `"use client"` — в **145 из 230** `.tsx`. Практически всё приложение клиентское,
  преимущества Server Components не используются.
- `public/` — **38 МБ**. Крупнейшие: `tenants-bg.png` 4.5 МБ, `tada-stage.png` 3.2 МБ,
  `img_social_01.png` 2.0 МБ, `operator-reinvent-bg.png` 1.8 МБ, `img_social_02.png` 1.8 МБ.
  PNG без сжатия и без WebP/AVIF-вариантов. `next.config.ts` разрешает оптимизацию
  только для remote-паттернов (`**.amazonaws.com`, `images.unsplash.com`).
- `shared/lib/performance/{lazy-loading,memoization}.ts` и `shared/lib/optimization/
  {debounce,virtual-scrolling}.ts` — инфраструктура «на будущее», реально почти не используется.

---

## 9. i18n

`src/translations/` — 10 языков (`ar, de, en, es, fr, hi, it, pl, ru, tr`),
управляется Localazy (`localazy.json`, скрипты `localazy:upload/download/sync`).
Правка JSON вручную запрещена — они перезаписываются синхронизацией.
Контекст — `app/contexts/I18nContext.tsx` + хук `app/hooks/useTranslation.ts`,
ключи собраны в `app/lib/translationsKeys/`.
Это один из самых аккуратно сделанных участков фронта.

---

## 10. Тесты

- **Playwright e2e — 6 спеков**: `auth`, `admin`, `onboarding`, `property-browsing`,
  `shortlist`, плюс `fixtures.ts` и `global-setup.ts` с сохранёнными состояниями
  аутентификации (`e2e/.auth/{admin,tenant,fresh-tenant}.json`).
  `baseURL: http://localhost:3000`, только Chromium.
  **Это самый ценный существующий актив для рефакторинга** — готовая сетка защиты.
  В CI не запускаются.
- Unit-тестов нет (единственный — битый vitest-файл, §6).
