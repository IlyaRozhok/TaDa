# TaDa Rental Platform — Monorepo Rules

## Repository layout

```
tada-prod/
├── backend/         # NestJS API (Node.js, TypeORM, PostgreSQL, Redis, S3)
├── frontend/        # Next.js 16 App Router (React 19, Redux, RTK Query, Tailwind v4)
├── infrastructure/  # Terraform
├── nginx/
└── docker-compose.yml
```

## Branches

| Branch     | Environment | Deploy rule                       |
|------------|-------------|-----------------------------------|
| `master`   | Production  | Never push directly; PR + review  |
| `develop`  | Staging     | Feature branches merge here first |

Feature branches: `feature/<name>`, `fix/<name>`, `refactor/<name>` — always off `develop`.

> If the production branch is actually named `main`, correct this table.

## Cross-cutting rules

- No commented-out code. Delete dead code; git history preserves it.
- No Russian (or any non-English) comments or strings in source files. Code comments in English only.
- No `console.log` in committed code. Backend logs via NestJS `Logger`; frontend reports errors via Sentry. **Never swallow errors silently.**
- No `any` in new TypeScript code without an inline `// eslint-disable` and a justification.
- No `TODO`/`FIXME` committed without a linked issue number.
- Do not commit `*.local`, `.env.*`, `*.tfstate*`, or any secret files.

## Safety net before refactoring

Structural refactoring must not begin until golden-path tests are green (Phase 2 of the
roadmap). Until then, only bug fixes and housekeeping (Phase 0/1) are safe to run.

- **Golden-path e2e/integration tests come first** (Phase 2) and must cover the 5 critical
  user journeys: auth, property creation, matching, shortlist, admin basics. These tests
  are the regression guard for all subsequent refactoring.
- **Unit tests are written only for new, clean code** — after a feature has been refactored
  into its FSD layer. Never write unit tests for legacy code that is about to be rewritten
  or deleted; it wastes effort and anchors bad structure.
- Type-checking is necessary but **not sufficient** verification. "Verify by clicking
  through the app" does not catch silent regressions in DI-wired or 15K-line code.
- Test runner setup (Jest for backend, Vitest + React Testing Library for frontend) is a
  **Phase 2 prerequisite**, not an optional initiative.

## Refactoring philosophy

This codebase is being incrementally simplified. Each step must keep observable behaviour
**identical**, and the order is chosen for safety, not speed:

1. **Establish a safety net** — golden-path tests must already be green (Phase 2 complete) before any structural refactoring starts.
2. **Consolidate duplicates** — same thing in two places: merge into one, verify identical behaviour.
3. **Move to the right layer** — relocate misplaced files to their canonical location.
4. **Simplify logic** — only after the above.
5. **Delete dead code LAST** — and only after confirming it is unreachable via NestJS DI,
   TypeORM entity metadata, Passport decorators, or Next.js route conventions, with tests green.

`refactor/`, `fix/`, and `feat/` are always separate commits. If you find a bug while
refactoring, log it as an issue and fix it on a separate branch — never inline.

## Invariants — Do Not Touch

These encode past incidents or prod-deploy blockers. Violating them can cause data loss,
credential exposure, or silent user-facing failures. Do not change without a synchronous
team discussion and a written rationale in the PR.

### TypeORM `synchronize`
- The current config is `synchronize: isDev ? env.TYPEORM_SYNCHRONIZE === "true" : false`.
  This env-guarded path is a footgun: a developer who sets `TYPEORM_SYNCHRONIZE=true` while
  pointed at a shared staging DB will silently drop/recreate columns (finding C3).
- Target: make `synchronize` a hard `false` in code — remove the env path entirely. All
  schema changes go through migrations, no exceptions.

### Auth tokens in URLs
- Never pass access/refresh tokens in query params or URL fragments — they leak into server
  logs, browser history, and `Referer` headers. Token delivery is httpOnly cookies only
  (already the case). Google OAuth callback sets cookies then redirects with `?success=true`
  only — keep it that way.

### S3 upload/refresh failures
- Never silently return a fallback/fake/stale URL when an S3 upload or presign fails.
  `uploadFile` must throw. `refreshUrl` / `refreshAvatarUrl` / `refreshMediaUrls` must surface
  the failure to the caller, not serve an expired URL (finding I1).

### Migrations
- Never edit a migration after it has run on staging or production — it breaks the migration
  table checksums. Fix mistakes with a new corrective migration.

### Dead-code deletion
- Do not delete code that merely *appears* unused. TypeScript "unused" warnings do not account
  for decorator-driven wiring (NestJS DI, TypeORM metadata, Passport, Next.js routes). Confirm
  unreachability with a repo-wide grep first.

### Terraform state
- `*.tfstate` / `*.tfstate.backup` must never be committed (finding C1). They contain plaintext
  secrets. If one is found in history, **rotate the affected credentials and scrub history**,
  not just `git rm`.

## Definition of Done

Mechanical gate for every PR. The global codebase is **not yet lint/type clean**, so until a
clean baseline is reached these checks apply to the **files you changed**, and the global
error count must **never increase** (ratchet).

### Backend
- [ ] `cd backend && npm run build` exits 0
- [ ] `cd backend && npm run lint` — no new errors on changed files
- [ ] No `console.log`; use `this.logger.*`
- [ ] New column: `nullable: true` or a `DEFAULT` in its migration
- [ ] Migration name PascalCase + descriptive (`AddFlexibleBudgetToPreferences`)
- [ ] No `synchronize: true` anywhere

### Frontend
- [ ] `cd frontend && npx tsc --noEmit` — no new errors on changed files
- [ ] `cd frontend && npm run lint` — no new errors on changed files
- [ ] No `console.log`
- [ ] New API call goes through RTK Query; no new axios in `src/app/lib/api.ts`
- [ ] New type in `src/types/`, not `src/app/types/`
- [ ] New component placed in its FSD layer, not `src/app/components/`

### Both
- [ ] No non-English comments/strings in source
- [ ] No `TODO`/`FIXME` without a linked issue
- [ ] No `.env.*` / secret / `*.tfstate*` files staged
- [ ] Feature branch off `develop`; PR targets `develop`
- [ ] New clean code (post-FSD migration) has unit tests; legacy code being deleted does not

## Known duplication to resolve (priority list)

Each item below follows the refactoring order above: tests/reachability check first, deletion last.

### Backend
- `modules/property/` is the real module. `modules/properties/` is an empty wrapper that
  re-exports the same service and controller — **delete it** (after grep-confirming nothing
  imports from the `modules/properties` path; then remove its import from `app.module.ts`).
- `TenantProfile` / `OperatorProfile` duplicate `User` fields (`full_name`, `phone`,
  `date_of_birth`, `nationality`, `address`) — long-term consolidation target; add no more
  duplicate columns meanwhile.

### Frontend
- `src/app/types/` duplicates `src/types/` — canonical is `src/types/`; delete `src/app/types/`
  after all imports are migrated.
- `src/app/lib/api.ts` (axios, 591 lines) coexists with `apiSlice.ts` (RTK Query) — RTK Query
  is the target; migrate progressively; add no new axios calls.
- `src/app/components/PropertyGridWithLoader.tsx` is a re-export shim — delete it; update callers
  to import from `@/widgets/property`.
- `src/pages/profile/ui/` is empty — delete.
- `src/app/properties/[id]/test-page.tsx` and `src/app/properties/[id]/test/` are dev artifacts —
  delete (confirm no internal links first).
