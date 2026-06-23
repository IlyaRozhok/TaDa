# Backend — NestJS Rules

## Stack

- **Runtime**: Node.js, TypeScript 5
- **Framework**: NestJS 10
- **ORM**: TypeORM 0.3 with PostgreSQL
- **Cache**: Redis (ioredis)
- **Storage**: AWS S3 (`@aws-sdk/client-s3`)
- **Auth**: JWT + Google OAuth (Passport)
- **Rate limiting**: `@nestjs/throttler` (short/medium/long tiers)
- **Monitoring**: Sentry (`@sentry/nestjs`)
- **Docs**: Swagger (auto-generated from decorators)

## Module structure

```
src/
├── app.module.ts          # Root module — only imports, no logic
├── main.ts                # Bootstrap, CORS, Swagger, pipes
├── instrument.ts          # Sentry init (imported first in main.ts)
├── entities/              # TypeORM entities (all shared across modules)
├── common/
│   ├── constants/
│   ├── decorators/        # @Auth(), @CurrentUser(), @Roles()
│   ├── dto/               # Shared DTOs (e.g. PaginationDto)
│   ├── filters/           # Exception filters (Sentry)
│   ├── guards/            # JwtAuthGuard, RolesGuard
│   └── services/          # S3Module, RedisModule (global shared services)
├── database/
│   ├── data-source.ts     # TypeORM DataSource (for migrations CLI)
│   ├── typeorm.config.ts  # TypeORM config factory
│   └── migrations/        # Migration files (never edit after running in any shared env)
└── modules/               # Feature modules
    ├── auth/
    ├── booking-request/
    ├── building/
    ├── matching/
    ├── preferences/
    ├── property/          # ← THE real property module
    ├── property-media/
    ├── shortlist/
    ├── tenant-cv/
    └── users/
```

## Invariants — Do Not Touch

See root `CLAUDE.md` for the full cross-cutting list. Backend-specific:

### TypeORM `synchronize`
Current code: `synchronize: isDev ? env.TYPEORM_SYNCHRONIZE === "true" : false`. This is **not**
commented out — the dev path is live and is a known footgun (finding C3). Target: replace with a
hard `false` and delete the env path. Never enable `synchronize` against any DB that migrations
have touched — it drops columns it considers orphaned, silently and irreversibly.

### S3 error handling
`S3Service.uploadFile()` must always throw on failure — never return a URL when the upload did
not complete. `refreshUrl()` / `refreshAvatarUrl()` / `refreshMediaUrls()` must not serve a stale
URL on presign failure (finding I1); callers must receive a null/error signal, not assume validity.

### Database SSL
For a **remote** database (e.g. RDS), TLS must verify the server certificate:
`ssl: { rejectUnauthorized: true, ca: <CA cert> }`. Never ship `rejectUnauthorized: false` to a
remote DB — it disables MITM protection (finding I2). If the DB is local to the host
(`localhost` / same-host container), SSL may be disabled; this rule applies when the DB is reachable
over a network.

### Matching cache
`MatchingCacheService` currently uses an in-memory `Map` (finding C2): it does not survive restarts
and does not work across multiple backend instances. Do not add more state to it. Target: migrate to
the already-global `RedisModule`. Until migrated, document this limitation at the call sites.

## Dead module — delete `modules/properties/`

`modules/properties/` contains only `PropertiesModule`, which re-exports the same `PropertyController`
and `PropertyService` from `modules/property/`. Grep-confirm nothing imports from the `modules/properties`
path, then delete the folder and remove its import from `app.module.ts`. The `PropertyModule` already
registered there is sufficient.

## Module conventions

Each module owns exactly:
- `<name>.module.ts` — imports, providers, controllers, exports
- `<name>.controller.ts` — HTTP layer only; no business logic
- `<name>.service.ts` — or sub-services in `services/` for complex modules
- `<name>.mapper.ts` — entity → response DTO transformation (if needed)
- `dto/` — request/response DTOs with class-validator decorators

Controllers must not query the database. Services must not build HTTP responses. Mappers must not
contain business logic.

### Sub-service pattern (users module)
When a service grows beyond ~150 lines, split by concern into `services/`:
`user-query.service.ts` (reads), `user-profile.service.ts` (profile mutations),
`user-role.service.ts` (role/status), `user-admin.service.ts` (admin ops). The facade
`UsersService` delegates — no queries directly in the facade.

## Entity rules

All entities live in `src/entities/`. Never define entities inside a module folder.

- `snake_case` column names (`created_at`, `operator_id`)
- Every entity gets `@CreateDateColumn()` and `@UpdateDateColumn()`
- Sensitive fields use `{ select: false }` (e.g. password)
- Computed getters must be pure (no async, no DB calls)
- `@ApiProperty` only where Swagger output is meaningful

### Known redundancy
`User` already has `full_name`, `phone`, `date_of_birth`, `nationality`, `address`. `TenantProfile`
and `OperatorProfile` duplicate these — long-term consolidation target; add no more duplicate columns.

## DTOs

- Input DTOs use `class-validator`; keep fields strict
- `ValidationPipe` is global with `whitelist: true` — unknown fields are stripped
- Use `PartialType` from `@nestjs/mapped-types` for update DTOs; never duplicate field definitions
- Never return raw entities from controllers — use response DTOs or mappers

## Auth & guards

- `@Auth()` combines `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`
- `@Roles(UserRole.Admin)` + `RolesGuard` for role-based access
- `@CurrentUser()` injects the authenticated user from JWT payload
- Never read `req.user` directly in controllers — go through the guard system
- Debug/diagnostic endpoints (e.g. `@Get("test-token")`) must not exist in production code (finding M2) — delete them

## Database migrations

- In `src/database/migrations/`; never edit a migration applied to any shared env
- Generate: `npm run mig:gen -- src/database/migrations/DescriptiveName`
- Run dev: `npm run mig:run:dev` · Run prod: `npm run mig:run:prod`
- Names: descriptive PascalCase (`AddFlexibleBudgetToPreferences`)
- Make migrations data-safe: `nullable: true` or `DEFAULT` for new columns

## S3 & media

- All S3 ops go through `S3Service`
- Presigned URLs are per-request; never store permanent public URLs for private assets
- File-size limits enforced at the Multer layer

## Redis

- Cache keys namespaced by module: `matching:<userId>:results`
- TTL explicit on every cache set

## Error handling

- Let NestJS built-in exceptions propagate (`NotFoundException`, etc.)
- Never catch and swallow errors silently
- Sentry captures unhandled exceptions via `SentryGlobalFilter`

## Code style

- No JSDoc on internal methods — names should be self-documenting
- No non-English comments or strings
- `async/await` everywhere; no raw `.then()` chains
- Repositories via `@InjectRepository(Entity)` — no direct `DataSource` queries except migration scripts
- Explicit return types on public service methods

## Definition of Done (backend)

Until the global baseline is clean, checks apply to changed files; global error count must not increase.

- [ ] `npm run build` exits 0
- [ ] `npm run lint` — no new errors on changed files
- [ ] New migration safe for existing data (`nullable: true` or `DEFAULT`)
- [ ] Migration never edited after running in a shared env
- [ ] New endpoint uses `@Auth()` or documents why it opts out
- [ ] New service method has explicit return type; no raw `DataSource` queries
- [ ] No `console.log`; use `this.logger.*`
- [ ] No `synchronize: true` in any config path
- [ ] Behaviour-changing refactor is covered by a test pinning prior behaviour
