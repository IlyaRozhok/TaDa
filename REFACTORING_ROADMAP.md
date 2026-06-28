# TaDa Rental Platform — Refactoring Roadmap

This document defines the strategic, step-by-step sequence for cleaning the codebase. We move sequentially through the User Journey. Each feature must be refactored inside an isolated branch, thoroughly cleaned, and paired with tests.

> **Scope note:** The operator landing and tenant landing pages are OUT OF SCOPE for all phases below. Only the platform (authenticated app) and admin panel are in scope.

## Meta-Instructions for the AI (Refactoring Philosophy)

1. **Investigate First:** Before changing any code, trace the current execution flow. Identify exactly what is active and what is dead weight.
2. **Preserve & Purge:** Retain all active business logic. Aggressively delete unused files, duplicate components, obsolete axios calls, and dev artifacts belonging to the current scope.
3. **Propose Architecture Mid-Flight:** Stop and present architectural choices to the user if you discover high-density tech debt or a cleaner design pattern during the feature refactor.
4. **When in Doubt, Ask:** If you are unsure whether a piece of logic is dead or alive (especially due to decorator-driven wiring like NestJS DI or TypeORM metadata), do not guess — explicitly ask the user.
5. **No Broken Windows:** Golden-path integration/e2e tests must exist before any structural refactoring begins. Unit tests are written only for new clean code after a feature is refactored — never for legacy code about to be rewritten.
6. **Best practices:** Think first, then generate a plan for the user to approve before touching any code.

---

## Working Agreement

- Every unit of work = its own branch (`fix/`, `feat/`, `refactor/`, `docs/`) → PR into `develop`.
- Workflow: Claude proposes a plan → user reviews → user approves → Claude executes.
- **Claude never makes code changes without an approved plan.**
- When in doubt about whether logic is dead or alive: ask, never guess.
- Landings (operator, tenant) are OUT OF SCOPE for all phases.

---

## Phase 0 — Housekeeping *(do first, before anything else)*

**Goal:** reduce noise so subsequent phases work on a clean baseline. No behavior changes.

### Tasks
- Remove stale local worktrees and their tracking branches.
- Dead weight pass:
  - Delete confirmed-dead files (check for zero imports via `grep -r` before deleting).
  - Deduplicate the three `FormField` components — keep only `src/shared/ui/FormField/`, update all callers.
  - Deduplicate upload utilities scattered across `api.ts` and feature files.
  - Remove all `console.log` statements from platform and admin code.
  - Remove all non-English user-visible strings from platform and admin code.
- No logic changes, no moves, no renames beyond deduplication targets above.

**Deliverable:** one PR, `tsc --noEmit` passes, `npm run lint` passes, all green.

---

## Phase 1 — Bug Fixes *(current priority)*

**Goal:** stabilize the live product before touching structure.

### Rules
- Each bug gets its own branch: `fix/<short-description>` → PR into `develop`.
- No refactoring mixed into bug-fix branches — fix only what is broken.
- Deployment to staging after each merge.

**Deliverable:** all known bugs resolved, merged to `develop`, staging is green.

---

## Phase 2 — Test Infrastructure

**Goal:** build the safety net that makes all future refactoring safe.

### Tasks
- **Frontend:** add Vitest + React Testing Library; configure with the existing TypeScript and path-alias setup.
- **Backend:** confirm Jest setup; document module mocking patterns in `backend/CLAUDE.md`.
- Write golden-path integration / e2e tests for the 5 most critical user journeys:
  1. Auth (register → login → refresh → logout)
  2. Property creation (operator creates listing with images)
  3. Tenant matching (preferences saved → matches returned)
  4. Shortlist (add / remove / view)
  5. Admin panel basics (view users, moderate listings)
- These tests are the regression guard for all subsequent phases — they must remain green on every PR.
- CI pipeline must run them on every PR to `develop` and `main`.

**Deliverable:** test runner configured, all five golden-path suites pass, CI enforces them.

---

## Phase 3 — FSD Migration *(platform + admin only)*

**Goal:** move `src/app/components/` into FSD layers feature by feature.

### Rules
- One feature at a time, each in its own branch + PR.
- Order: shared infrastructure first, then feature by feature following the user journey.
  1. Types consolidation (`src/app/types/` → `src/types/`)
  2. RTK Query base setup; `shortlistSlice` axios → RTK Query
  3. Shared `FormField` (already done in Phase 0)
  4. Auth feature slice
  5. Property feature slice (listing, detail, creation)
  6. Matching feature slice
  7. Shortlist feature slice
  8. Profile / onboarding feature slice
  9. Admin panel slice
- For each feature: investigate → propose plan → user approves → implement → unit tests for new code only → PR.
- DB / entity changes: migrations via `npm run mig:gen` only; schema changes in backend and frontend types land in the same PR.
- `src/app/components/` must be empty by the end of this phase; then delete it.

**Deliverable:** FSD structure fully adopted for platform and admin; axios removed from new code; `src/app/components/` deleted.

---

## Phase 4 — Stabilization

**Goal:** harden the refactored codebase.

### Tasks
- Enable TypeScript `strict` mode project-wide (fix errors file by file, one PR each).
- Remove all remaining `any` types in platform and admin code.
- Performance audit: identify and fix the top render bottlenecks (profile from actual usage, not speculation).
- Address the `MatchingCacheService` in-memory `Map` — migrate to `RedisModule`.

**Deliverable:** `strict: true` passes with no suppressed errors; no `any` in scope; in-memory cache replaced.
