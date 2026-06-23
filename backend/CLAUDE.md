# Backend — NestJS Rules

## Stack
Node.js · TypeScript 5 · NestJS 10 · TypeORM 0.3 + PostgreSQL · Redis (ioredis) ·
AWS S3 (`@aws-sdk/client-s3`) · JWT + Google OAuth (Passport) · `@nestjs/throttler` ·
Sentry (`@sentry/nestjs`) · Swagger.

## Module structure
```
src/
├── app.module.ts     # imports only, no logic
├── main.ts           # bootstrap, CORS, Swagger, pipes
├── instrument.ts     # Sentry init (imported first in main.ts)
├── entities/         # ALL TypeORM entities — never inside a module folder
├── common/           # decorators (@Auth, @CurrentUser, @Roles), guards, filters,
│                     # dto, services (S3Module, RedisModule)
├── database/         # data-source.ts, typeorm.config.ts, migrations/
└── modules/          # feature modules (auth, property, users, matching, …)
```

## Module conventions
Each module owns exactly:
- `<name>.module.ts` — DI wiring (imports, providers, controllers, exports).
- `<name>.controller.ts` — HTTP boundary only: DTO parsing, validation, status codes.
  Zero business logic, no DB queries.
- `<name>.service.ts` — business logic. Split into `services/` sub-services once it passes
  ~150 lines (e.g. `query.service.ts`, `mutation.service.ts`); the facade delegates and
  holds no queries.
- `<name>.mapper.ts` — entity → response DTO. Never return raw entities from controllers.
- `dto/` — `class-validator` request/response DTOs. Use `PartialType` for update DTOs.

## Entity rules
- All entities in `src/entities/`, `snake_case` columns.
- Every entity has `@CreateDateColumn()` and `@UpdateDateColumn()`.
- Sensitive fields use `{ select: false }` (e.g. password).
- Computed getters stay pure — no async, no DB calls.
- Known redundancy: `User` already has `full_name`, `phone`, `date_of_birth`, `nationality`,
  `address`; `TenantProfile`/`OperatorProfile` duplicate these. Add no more duplicate
  columns; consolidation is a roadmap target.

## Auth & guards
- `@Auth()` = `JwtAuthGuard` + `@ApiBearerAuth()`; `@Roles(UserRole.Admin)` + `RolesGuard`
  for role-based access.
- `@CurrentUser()` injects the authenticated user — never read `req.user` directly in
  controllers.
- No debug/diagnostic endpoints in committed code (e.g. `test-token`, `config-check`).

## Migrations
- In `src/database/migrations/`; never edit one applied to a shared env.
- Generate: `npm run mig:gen -- src/database/migrations/DescriptiveName`.
  Run: `mig:run:dev` / `mig:run:prod`.
- PascalCase descriptive names. New columns data-safe: `nullable: true` or `DEFAULT`.

## Conventions
- `async/await` everywhere; no raw `.then()` chains.
- Repositories via `@InjectRepository(Entity)` — no direct `DataSource` queries outside
  migration scripts.
- Explicit return types on public service methods.
- Redis keys namespaced by module (`matching:<userId>:results`) with an explicit TTL.
- Let NestJS exceptions propagate (`NotFoundException`, etc.); Sentry captures unhandled
  ones via `SentryGlobalFilter`. Never catch and swallow silently.

## Known limitation
`MatchingCacheService` uses an in-memory `Map` — it does not survive restarts and does not
work across multiple backend instances. Add no more state to it; migrate to the global
`RedisModule`.

## Invariants & Definition of Done
See the root `CLAUDE.md` for the cross-cutting invariants (synchronize, S3 failures, DB SSL,
migrations) and the backend Definition of Done checklist.
