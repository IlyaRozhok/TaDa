# 02 — Backend: карта модулей, энтити, состояние БД

> NestJS 10, TypeORM 0.3, PostgreSQL. 144 файла, ~15 800 строк.
>
> **Пересверено против `develop`.** Все критические находки (R1 эскалация привилегий,
> R2 путь миграций, R3 дрейф миграций, R4 отсутствие индексов, R17 `/api/test-sentry`)
> подтверждены на `develop` без изменений. Diff выводов —
> в [`00-revision-note.md`](./00-revision-note.md).
>
> Что уже сделано на `develop` и снято с повестки: Redis-модуль удалён из кода
> (`redis.module.ts`, `ioredis`, `@types/ioredis`), удалены `auth-token.service.ts`
> и `auth-validation.service.ts` (−309 строк).

---

## 1. Карта модулей

```
AppModule
├── SentryModule.forRoot()
├── ConfigModule (global, .env.local → .env)
├── TypeOrmModule.forRootAsync(typeOrmConfig)
├── ThrottlerModule (short 15/1s, medium 60/10s, long 200/60s) + APP_GUARD
├── S3Module          @Global
│
├── AuthModule ──────────forwardRef──┐
├── UsersModule ─────────forwardRef──┤
├── PreferencesModule                │
├── MatchingModule                   │
├── PropertyModule                   │
├── PropertyMediaModule              │
├── ShortlistModule                  │
├── BuildingModule                   │
├── TenantCvModule ──────forwardRef──┘
└── BookingRequestModule
```

### Граф зависимостей между доменными модулями

```
AuthModule ──forwardRef──▶ TenantCvModule
                               │
                          forwardRef
                               ▼
UsersModule ◀──forwardRef──────┘
     │
 forwardRef
     ▼
AuthModule

PreferencesModule ──▶ TenantCvModule   (обычный import)
ShortlistModule   ──▶ S3Module
```

### Циклические зависимости — 2 цикла

**Цикл A (2 узла):** `UsersModule ⇄ AuthModule`
- `users.module.ts`: `forwardRef(() => AuthModule)`
- `auth.module.ts` тянет `TenantCvModule`, который тянет `UsersModule`

**Цикл B (3 узла):** `AuthModule → TenantCvModule → UsersModule → AuthModule`
Все три ребра обёрнуты в `forwardRef`. Приложение стартует, но:
- порядок инициализации провайдеров недетерминирован;
- любая попытка вынести модуль в отдельный сервис упрётся в этот клубок;
- unit-тестирование требует моков всего цикла.

`forwardRef` здесь — не решение, а симптом. Реальная причина: `TenantCv` (резюме арендатора)
логически принадлежит домену пользователя, но выделен в отдельный модуль, который при этом
нужен и авторизации, и предпочтениям.

### Нарушения границ (модуль лезет напрямую в чужой сервис)

| Файл | Нарушение |
|---|---|
| `modules/auth/auth.service.ts:8` | `import { TenantCvService } from "../tenant-cv/tenant-cv.service"` |
| `modules/preferences/preferences.service.ts:13` | `import { TenantCvService } from "../tenant-cv/tenant-cv.service"` |

Оба импорта — прямое обращение к сервису чужого модуля по относительному пути,
минуя публичный API модуля (barrel/интерфейс). Это делает `TenantCvService` фактически
глобальным синглтоном без объявления.

**Системное нарушение границ:** все энтити лежат в плоской глобальной папке `src/entities/`
и импортируются любым модулем. `ShortlistModule` регистрирует `TenantProfile` и `User`,
`MatchingModule` — `Property`, `Preferences`, `User`, `BuildingModule` — `Building`,
`Property`, `User`. Владения данными нет: любой модуль может писать в любую таблицу.

### Размер модулей

| Модуль | Файлов | Строк | Комментарий |
|---|---|---|---|
| matching | 6 | **2831** | `matching-calculation.service.ts` — 1941 строка в одном файле |
| users | 13 | 1684 | единственный модуль с внутренним разделением на сервисы |
| property | 8 | 1394 | контроллер 353 стр., DTO 421 стр. |
| building | 6 | 1102 | |
| preferences | 6 | 940 | DTO 495 стр. |
| tenant-cv | 6 | 541 | |
| auth | 8 | 439 | |
| property-media | 3 | 375 | |
| shortlist | 3 | 369 | |
| booking-request | 5 | 286 | |

Слоя доступа к данным нет — сервисы работают с `Repository<T>` напрямую.
`UsersModule` — единственный, где сделана декомпозиция
(`user-query`, `user-admin`, `user-role`, `user-profile` + `user.mapper`).
Это удачный образец, который стоит распространить на остальные модули.

---

## 2. HTTP-поверхность

71 маршрут. Полный список — в конце документа (§8).

Схема авторизации: два механизма, оба живые:
1. `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` — явно, в большинстве контроллеров.
2. `@Auth(...roles)` — композитный декоратор (`common/decorators/auth.decorator.ts`),
   применяет те же два guard'а + Swagger-аннотацию. Используется только в `PreferencesController`.

Два способа делать одно и то же — источник ошибок: при код-ревью легко не заметить,
что на маршруте нет ни того, ни другого.

### Аутентификация

Логина/регистрации по паролю **на бэкенде нет**. Единственный вход — Google OAuth
(`GET /api/auth/google` → `GET /api/auth/google/callback`). Колонка `users.password`
существует и `@Exclude()`-ится, но ни один маршрут её не использует.

Токены: httpOnly-cookie `access_token` + `refresh_token`, `secure` в проде, `sameSite: lax`.
Refresh — ротируемый, хеш хранится в `users.refresh_token_hash`, при `logout` обнуляется.
Реализация корректная.

---

## 3. Проблемы безопасности

### 3.1 КРИТИЧНО — эскалация привилегий до admin

`modules/users/users.controller.ts:173`

```ts
@Put(":id/role")
@UseGuards(JwtAuthGuard)          // ← RolesGuard отсутствует
async updateUserRole(@Param("id") id, @Body() updateData: { role: string }, @Req() req) {
  if (req.user.id !== id && req.user.role !== UserRole.Admin) {
    throw new ForbiddenException("Unauthorized to update this role");
  }
  const user = await this.usersService.updateUserRole(id, updateData.role);
  ...
}
```

Условие пропускает запрос, если `req.user.id === id`, то есть **пользователь меняет свою
собственную роль**. Дальше `UserRoleService.updateUserRole`:

```ts
const roleEnum = typeof role === "string"
  ? Object.values(UserRole).find(r => r === role) || UserRole.Tenant
  : role;
```

`"admin"` — валидное значение `UserRole`, whitelist отсутствует.

**Эксплуатация:** любой залогиненный пользователь делает
`PUT /api/users/<свой-id>/role` с телом `{"role":"admin"}` и получает полный админ-доступ
(управление пользователями, зданиями, объектами, заявками).

**Это самая опасная находка аудита.** Маршрут вызывается из фронта
(`authAPI.updateUserRole`, `app/lib/api.ts`) в сценарии онбординга — выбор
«я арендатор / я оператор». То есть просто закрыть маршрут админом нельзя, сломается онбординг.
Нужен раздельный контракт: self-service смена роли с whitelist `{tenant, operator}`
и отдельный админский маршрут. Детали — в `05`, Фаза 0.

### 3.2 Открытый эндпоинт, бросающий исключение

`app.controller.ts:18` — `GET /api/test-sentry` без guard'ов, доступен в проде.
Даёт неаутентифицированному пользователю способ генерировать 500-е и мусорить в Sentry.

### 3.3 Throttler в памяти

`ThrottlerModule.forRoot` без storage → счётчики в heap процесса.
При горизонтальном масштабировании лимиты умножаются на число инстансов.

### 3.4 CORS захардкожен

`main.ts` содержит список origin'ов литералом; переменная `CORS_ORIGIN` из `.env.production`
не читается. Добавление домена требует пересборки.

---

## 4. Энтити TypeORM

10 энтити в `src/entities/`, все таблицы `snake_case`.

| Энтити | Таблица | Строк | Ключевое |
|---|---|---|---|
| `User` | `users` | 178 | `email` unique, `role`/`status` — pg enum, `password` и `refresh_token_hash` c `select: false` |
| `Property` | `properties` | 340 | центральная сущность, много `jsonb` |
| `Building` | `buildings` | 299 | `metro_stations`, `areas`, `districts` — `jsonb` |
| `Preferences` | `preferences` | 440 | самая широкая, ~60 колонок |
| `TenantProfile` | `tenant_profiles` | — | |
| `OperatorProfile` | `operator_profiles` | — | |
| `TenantCv` | `tenant_cvs` | — | |
| `Shortlist` | `shortlist` | — | unique `(userId, propertyId)` |
| `PropertyMedia` | `property_media` | — | |
| `BookingRequest` | `booking_requests` | — | unique `(tenant_id, property_id)`, enum-статус из 11 значений |

### Связи

```
User 1─1 Preferences        (cascade: true)
User 1─1 TenantProfile      (cascade: true)
User 1─1 OperatorProfile    (cascade: true)
User 1─1 TenantCv           (cascade: true)
User 1─N Shortlist
User 1─N Building           (operator)
Building 1─N Property
Property N─1 User           (operator)
Property 1─N PropertyMedia  (onDelete CASCADE)
BookingRequest N─1 Property (onDelete CASCADE)
BookingRequest N─1 User     (onDelete CASCADE)
```

### Проблемы моделирования

**П1 — Ни одного `@Index()` во всём проекте.**
Проверено: `grep -rn "@Index" src/entities/` → пусто. Индексы существуют только те,
что Postgres создал автоматически под PK и UNIQUE-констрейнты.

Не проиндексированы **все внешние ключи**: `properties.building_id`, `properties.operator_id`,
`property_media.property_id`, `booking_requests.property_id`, `booking_requests.tenant_id`,
`shortlist.userId`, `shortlist.propertyId`, `preferences.user_id`.
На объёме прод-данных каждый join — seq scan. Это тихая деградация: пока строк мало,
незаметно; на 10k+ объектов начнёт болеть внезапно.

Не проиндексированы колонки, по которым фильтрует матчинг: `properties.price`,
`bedrooms`, `bathrooms`, `property_type`, `furnishing`.

**П2 — `simple-array` вместо `jsonb`.**
`Building.photos` — `@Column("simple-array", { nullable: true, default: "" })`,
`OperatorProfile.operating_areas / property_types / services` — тоже.
`simple-array` хранит значения строкой через запятую: невозможно индексировать,
невозможно фильтровать в SQL, ломается на значениях с запятой внутри.
При этом соседние поля тех же энтити уже `jsonb` — модель непоследовательна.

**П3 — `Preferences` как god-таблица.**
~60 колонок в одной таблице, смешаны бюджет, локация, тип жилья, образ жизни, KYC,
занятость. Одновременно `preferences.entity.ts` (440 строк) и
`create-preferences.dto.ts` (495 строк) описывают одно и то же вручную.

**П4 — Денормализация Property ↔ Building без правил.**
`Property.address`, `amenities`, `pet_policy`, `metro_stations` помечены в комментариях как
«inherited from building or custom». Инварианта нет, синхронизация — на совести кода.
Расхождение данных обнаружится только через UI.

**П5 — `cascade: true` на всех 1-1 от `User`.**
Сохранение `User` каскадно пишет `Preferences`, `TenantProfile`, `OperatorProfile`, `TenantCv`.
В сочетании с `relations: [...]` в `UserRoleService` это делает любую операцию с
пользователем тяжёлой и труднопредсказуемой.

**П6 — Отсутствие `onDelete` на части связей.**
`Property → User(operator)` и `Property → Building` объявлены без `onDelete`, тогда как
`BookingRequest`, `Shortlist`, `PropertyMedia` — с `CASCADE`. Политика удаления неоднородна.

### Риски N+1

`MatchingService` (`matching.service.ts`) — основной кандидат:
- `getMatches` (стр. ~90): `findOne` предпочтений → `createQueryBuilder("property")` **без join'ов**.
  Далее `updatePhotosUrls(property)` вызывает `s3Service.refreshMediaUrls` **на каждый объект**
  в цикле — то есть N обращений к S3-презайнеру на страницу выдачи.
- `getDetailedMatches` (стр. ~307) — здесь join'ы есть
  (`leftJoinAndSelect("property.building")`, `.operator`), то есть один и тот же домен
  запрашивается двумя разными способами.
- `UserRoleService.updateUserRole` делает `findOne` с `relations` **дважды** (до и после транзакции).

`eager: true` не используется нигде — это правильно.

---

## 5. Состояние БД и миграций — главные находки

### 5.1 КРИТИЧНО — автозапуск миграций молча не работает

`src/database/typeorm.config.ts`:

```ts
migrationsRun: !isDev,
migrations: ["dist/migrations/*.js"],     // ← путь неверный
```

Миграции лежат в `src/database/migrations/` и компилируются в
**`dist/database/migrations/*.js`** (проверено: 48 `.js` файлов на месте, `dist/migrations/`
не существует).

Значит на старте в проде TypeORM находит **ноль** миграций и рапортует успех.
`migrationsRun` — тихий no-op.

Почему прод всё-таки мигрирует: в `deploy.yml` есть отдельный явный шаг
`docker compose exec -T backend npm run mig:run:prod`, который использует
`dist/database/data-source.js`, а там путь собран через
`path.join(__dirname, "migrations/*{.ts,.js}")` — то есть корректный.

**Вывод:** схема поддерживается в актуальном состоянии одной строкой в CI.
Уберите её — и миграции перестанут применяться, без единой ошибки в логах.
Чинить нужно оба места: путь в `typeorm.config.ts` и решение о том, кто именно
источник истины (рекомендация — явный шаг в CI, а `migrationsRun: false`).

### 5.2 Вторая, устаревшая папка миграций

`backend/database/migrations/` (вне `src/`), 3 файла:
```
1764152308457-init_schema.ts
1764200000000-add-property-amenities.ts
1782838234187-add-description-buildings.ts
```
Ни один конфиг на неё не ссылается. При этом `Dockerfile` содержит
`COPY database ./database` — мусор едет в прод-образ. Классическая ловушка:
разработчик кладёт миграцию не в ту папку, она не применяется, и это никак не диагностируется.

### 5.3 Дрейф в таблице `migrations`

Локальная БД: **51 применённая миграция при 50 файлах на диске**.

```
Применена в БД, файла нет:  AddRefreshTokenHashToUser1775100000000
На диске есть двойник:       AddRefreshTokenHashToUsers1785246923429   (User → Users, новый timestamp)
```

Миграцию переименовали/пересоздали после того, как она уже была применена локально.
На стейдже и в проде состояние может отличаться. **Перед любым рефакторингом схемы
нужно сверить `SELECT name FROM migrations` на prod и stage со списком файлов.**

### 5.4 `synchronize` — под контролем

| Конфиг | Значение | Оценка |
|---|---|---|
| `typeorm.config.ts` (рантайм приложения) | `isDev ? env.TYPEORM_SYNCHRONIZE === "true" : false` | Безопасно: в проде жёстко `false`, в dev — только по явному флагу |
| `data-source.ts` (CLI для миграций) | `process.env.NODE_ENV === "development"` | Приемлемо, но лучше `false` константой — этот datasource нужен только для CLI |

Порочной практики «synchronize вместо миграций» **нет**. Это сильная сторона проекта.

### 5.5 Соответствие энтити реальной схеме — совпадает

Запущено `typeorm schema:log` против локальной БД:

```
Your schema is up to date - there are no queries to be executed by schema synchronization.
```

Энтити и локальная схема идентичны, дрейфа нет. Это хорошая новость: модель данных
можно считать достоверной отправной точкой. (Проверку следует повторить против stage/prod.)

### 5.6 Прочее

- `migrations` в `data-source.ts` собран через `path.join(__dirname, ...)` — работает и в ts, и в js. Правильно.
- Двойное описание списка энтити: `data-source.ts` перечисляет все 10 руками,
  а `typeorm.config.ts` использует `autoLoadEntities: true`. Новая энтити, забытая
  в `data-source.ts`, не попадёт в генерацию миграций.
- Скрипты `db:reset` / `db:reset:seed` ссылаются на `scripts/reset-database.js`,
  которого **нет** — в `backend/scripts/` лежит только `seed-stage-units.mjs`.
  Три npm-скрипта из package.json нерабочие.

---

## 6. Качество кода бэкенда

- `tsconfig.json`: `strictNullChecks: true` (хорошо), но `noImplicitAny: false`,
  `strictBindCallApply: false`, `forceConsistentCasingInFileNames: false`. Полного `strict` нет.
- `npx tsc --noEmit` → **проходит без ошибок**.
- 23 вхождения `: any`.
- 88 `console.*`, `Logger` из Nest — 1 раз. Логирование фактически отсутствует.
- ESLint для бэкенда **не настроен вообще** (нет `.eslintrc`, нет `eslint` в devDependencies).
- Тесты: 2 файла (`user.mapper.spec.ts`, `user-profile.service.spec.ts`).
  `npm test` сейчас падает — `jest` объявлен в devDependencies, но отсутствует в `node_modules`
  (`node_modules/.bin/jest` нет). Требуется `npm install`.
- Комментарии в коде смешанные — русский и английский вперемешку, включая публичные API.

---

## 7. Мёртвый код бэкенда

- `dto/test-login.dto.ts` — маршрута тест-логина нет.
- `entities/index.ts` — пустой barrel (при этом `@/entities` импортируется в matching).
- Колонка `users.password` — заполняется только при удалённой регистрации; вход только через Google.
- Redis: модуль и сервис **удалены на `develop`** (PR #44) — код чист.
  `docker-compose.yml` вычищен в ходе аудита (сервис, `depends_on`, том `redis_data`).
  Остаточная чистка вне репозитория: `REDIS_*` в `.env.production` и в `/opt/tada/.env`
  на хостах, осиротевший том и контейнер `tada-redis` на VPS.
- `sharp`-зависимости в Dockerfile при отсутствии `sharp` в package.json.

---

## 8. Полный список маршрутов (71)

```
GET    /api/                                  GET    /api/health
GET    /api/test-sentry            ← открыт, бросает 500

GET    /api/auth/me                           POST   /api/auth/refresh
POST   /api/auth/logout                       GET    /api/auth/google
GET    /api/auth/google/callback

GET    /api/users/profile                     PUT    /api/users/profile
POST   /api/users/avatar                      DELETE /api/users/account
GET    /api/users                    [admin]  POST   /api/users            [admin]
PUT    /api/users/:id                [admin]  DELETE /api/users/:id        [admin]
PUT    /api/users/:id/role           ← ЭСКАЛАЦИЯ ПРИВИЛЕГИЙ

GET    /api/preferences/all          [admin]  POST   /api/preferences
GET    /api/preferences                       PUT    /api/preferences
DELETE /api/preferences                       PUT    /api/preferences/admin/:userId  [admin]
DELETE /api/preferences/admin/:userId [admin]

GET    /api/properties/public/all             GET    /api/properties/public/:id
GET    /api/properties/public                 POST   /api/properties/upload/photos
POST   /api/properties/upload/video           POST   /api/properties/upload/documents
POST   /api/properties                        GET    /api/properties
GET    /api/properties/:id                    PATCH  /api/properties/:id
DELETE /api/properties/:id

POST   /api/properties/:propertyId/media      GET    /api/properties/:propertyId/media
DELETE /api/properties/:propertyId/media/:mediaId
PUT    /api/properties/:propertyId/media/order

GET    /api/buildings/public/:id              POST   /api/buildings           [admin]
GET    /api/buildings                [admin]  GET    /api/buildings/operators [admin]
GET    /api/buildings/:id            [admin]  PATCH  /api/buildings/:id       [admin]
DELETE /api/buildings/:id            [admin]  POST   /api/buildings/upload/logo      [admin]
POST   /api/buildings/upload/video   [admin]  POST   /api/buildings/upload/photos    [admin]
POST   /api/buildings/upload/documents [admin]

GET    /api/matching/matches                  GET    /api/matching/top-matches
GET    /api/matching/detailed-matches         GET    /api/matching/property/:propertyId
GET    /api/matching/recommendations          GET    /api/matching/matched-properties

POST   /api/shortlist/:propertyId             DELETE /api/shortlist/:propertyId
GET    /api/shortlist                         GET    /api/shortlist/count
GET    /api/shortlist/check/:propertyId       DELETE /api/shortlist

GET    /api/tenant-cv/me                      GET    /api/tenant-cv/current
PUT    /api/tenant-cv                         POST   /api/tenant-cv/share
GET    /api/tenant-cv/:share_uuid    ← публичный, по uuid

POST   /api/booking-requests         [tenant/admin]
GET    /api/booking-requests         [admin]
GET    /api/booking-requests/me      [tenant/admin]
PATCH  /api/booking-requests/:id/status [admin]
```
