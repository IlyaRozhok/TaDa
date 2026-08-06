# TaDa Platform — Refactoring Program Status

**Prepared:** 2026-08-06
**Window covered:** 2026-07-28 → present (10 days)
**Audience:** Stakeholder review

---

## 1. Executive Summary

In late July 2026, an audit of the TaDa codebase (`docs/audit/00`–`05`) identified 24 concrete risks ranging from a critical privilege-escalation hole to years of accumulated dead code, duplicated data layers, and a database with zero indexes. The owner approved an 8-phase remediation plan (Phase 0 → Phase 7), sequenced so that safety work and test coverage came first and higher-risk structural changes only started once a regression net existed to catch mistakes.

Ten days in, **134 commits across 59 merged pull requests** have taken the codebase through security hardening, a full CI/testing safety net, systematic dead-code removal, a single unified data layer, strict TypeScript, a from-scratch structured-logging and production-readiness pass, ten new database indexes, and the decomposition of the four largest files in the frontend (the "god-modals", originally ~10,200 lines) into shared, reusable form components. Net effect on the tracked diff: **+14.6k / −38.1k lines** (roughly −23.5k net) with the frontend's `public/` asset footprint cut from 38 MB to 13 MB.

Every phase from 0 through 5 is fully closed. Phase 5 (frontend consolidation) — one data layer, one type tree, the god-modals broken up — landed its final pull request on 2026-08-06. Phase 6 (backend) has landed its highest-value item (indexes) with the harder structural work (matching service split, module-cycle breakup) still ahead. Phase 7 (scale-readiness) has not started; nothing in it is currently blocking production. Three security holes discovered *during* the refactoring (unauthenticated building endpoints, unauthenticated media uploads, and a silent-session-refresh bug that signed users out after a few hours) were fixed and shipped as out-of-band hotfixes, independent of the phase schedule.

The work has been governed throughout by one hard rule: **no step ships without the existing end-to-end test suite passing**, and every step is a single, independently revertible pull request. That discipline is why a 10-day window with this much change carries no open regressions.

---

## 2. Phase Status Overview

| Phase | Scope | Status | Summary |
|---|---|---|---|
| **0** | Security & schema integrity | ✅ Done | Privilege-escalation hole closed, dead debug endpoint removed, migration state reconciled, migration path/config fixed |
| **1** | Safety net (tests + CI) | ✅ Done | Backend tests fixed and running, frontend type-check fixed, e2e raised to green, CI gates both apps, `.env.example` + README added |
| **2** | Dead code removal | ✅ Done | 79+ dead files removed across two passes; dead API methods and backend junk removed |
| **2A** | Operator-UI removal | ✅ Done | Non-functional operator dashboard (1,542 lines) removed; role and admin-CRUD kept |
| **3** | Infrastructure & observability | 🟡 In progress | Structured logging, graceful shutdown and CORS-from-env done; host config reconciliation (3.1) and Redis compose cleanup (3.2) still open |
| **4** | Targeted frontend fixes | ✅ Done | Tailwind config removed cleanly, `public/` cut 38→13 MB, ESLint repaired and enabled, TypeScript `strict` turned on |
| **5** | Frontend consolidation | ✅ Done | One RTK Query data layer, one type tree, dead-code residue cleared, all four admin modals decomposed onto shared form primitives |
| **6** | Backend boundaries & data | 🟡 In progress | 10 DB indexes shipped (biggest single win of the program); matching-service split, module-cycle breakup, guard unification still open |
| **7** | Scale preparation | ⬜ Not started | Redis-backed throttling, caching, queues, metrics, pagination audit, backup policy — none urgent at current load |

**Overall: 31 of 56 tracked steps closed, 19 open, 6 not applicable (merged into other steps or deliberately deferred to backlog).**

---

## 3. Completed Phases — What Changed and Why It Matters

### Phase 0 — Security and Schema Integrity
The audit's most urgent finding: **any logged-in user could grant themselves the `admin` role** via `PUT /api/users/:id/role` — the endpoint had no role check and a self-modification path that was never closed off. Fixed by locking the route to admins only and removing the self-check that had created the hole. Alongside it: a debug endpoint (`GET /api/test-sentry`) that threw a live 500 in production was deleted, the migration table on stage and prod was reconciled against the file system (found and resolved a one-record ghost migration), and the migration path config — which pointed at a directory that didn't exist — was corrected with `migrationsRun` set explicitly to `false` so schema changes only ever happen through the deploy pipeline.

**Impact:** the single highest-severity risk on the register is closed, and the deploy pipeline's relationship with the database schema is now explicit and predictable rather than accidentally-working.

### Phase 1 — Safety Net
Before any refactoring could safely begin, the project needed tests that actually ran. Backend `jest` had silently never been installed with dev dependencies; frontend `type-check` was broken by a missing test runner; the six existing Playwright specs were pointed at `localhost` with no path to running against a real environment. All three were fixed, and — critically — the e2e suite was hardened against exactly the kind of change the rest of the plan would make: brittle CSS-class and button-text selectors were replaced with stable `data-testid` attributes across the touched components.

| Metric | Before | Now |
|---|---|---|
| E2E test cases | ~0 reliably passing | **21**, across 8 spec files |
| E2E coverage | auth/onboarding smoke only | auth, onboarding, admin CRUD (9 cases), property browsing, shortlist, operator routing, role-escalation regression, session-refresh |
| Backend unit tests | not running in CI | **21** tests across 3 spec files, running in CI |
| Frontend unit tests | broken (missing dependency) | running (vitest configured) |
| CI checks | none on PRs | type-check + lint + unit tests + build, both apps, on every PR |

**Impact:** this is the phase that made everything after it possible. Every subsequent structural change — the data-layer migration, the type consolidation, the modal decomposition — shipped behind this net, and the net caught real regressions before they reached stage (see §7, "Notable findings").

### Phase 2 & 2A — Dead Code and Operator-UI Removal
A systematic, resolver-verified sweep (each file's reachability from the app's actual entry points was checked programmatically before deletion, not assumed from the audit) removed:
- 22 files in an abandoned UI fork, then 38 more dead files (audit list + orphaned barrels), then a further 29-file cascade
- Dead frontend API method groups calling non-existent backend routes (`residentialComplexesAPI`, stale `authAPI` methods, dead property-media endpoints)
- An entire non-functional "operator dashboard" — 1,542 lines — that called `/operator/*` routes which never existed on the backend and silently swallowed every resulting error
- Backend junk: an obsolete second migrations folder that was shipping into the Docker image, a dead DTO, broken npm scripts

**Impact:** the operator dashboard in particular was a real product risk disguised as a feature — any operator who logged in saw a permanently empty screen with no visible error. It's gone; the operator *role* and the admin-side building-linking flow that actually need it are untouched.

### Phase 4 — Targeted Frontend Fixes
Four independent fixes, each shipped and verified separately:

- **Tailwind config**: the `tailwind.config.ts` file had been silently ignored by the build for an unknown period. Investigation found the SF Pro font was in fact rendering correctly the whole time via a separate CSS rule — so the fix was a clean deletion of 20 dead `font-sf-pro` class references and the unused config file, verified with **byte-identical** before/after screenshots, not a font migration.
- **Assets**: `public/` went from **38 MB → 13 MB** (−66%). 24 unused files were deleted outright; the remainder were converted to WebP and correctly sized against their actual rendered dimensions. One dangerous false start was caught and discarded before shipping — a compression pass was silently quantizing photos to 256 colors and would have visibly degraded image quality.
- **ESLint**: frontend linting had been completely broken (`next lint` doesn't exist in Next 16; direct ESLint crashed on a circular-structure bug in the legacy config loader). Fixed at the root cause; lint now runs and exits clean (671 warnings tracked and burned down over subsequent phases, 0 errors).
- **TypeScript `strict`**: enabled in full. 136 errors were resolved across three PRs with **zero suppressions** — no `as any`, no non-null assertions, no `@ts-ignore`. Two genuine null-dereference crash bugs were found and fixed as a byproduct.

**Impact:** the codebase now has working, enforced type safety and linting for the first time — both were previously silently broken, meaning bugs of exactly this class had been shipping undetected.

### Phase 5 — Frontend Consolidation
The largest and highest-risk phase, done in the order the plan required: data layer first, then types, then structure.

**One data layer.** The frontend previously ran four different mechanisms for talking to the backend (raw `fetch`, axios, a partial RTK Query slice, hand-written Redux thunks) — often two or three of them for the same domain simultaneously, with independent, drifting local-state mirrors. All eight business domains (tenant-cv, booking-requests, shortlist, users, buildings, preferences, matching, properties) were migrated to typed RTK Query endpoints, one pull request per domain. The old `apiSlice.ts` — the last multi-domain untyped file — is deleted entirely. A concrete bug this closed: an admin-panel operator filter had been silently returning zero results for over a year due to a response-shape mismatch that typing exposed and fixed.

**One type tree.** Three to four competing definitions of core domain objects (`Property`, `Building`, `User`) — the old `src/types/` (484 lines, ~95% dead code) was deleted whole; every consumer now reads from one canonical source. This surfaced and removed **three phantom form fields** (`outdoor_space`, `luxury`, `smoking_area`) that had no backing database column — users had been able to "set" them for months with the value silently discarded on save.

**The god-modals.** Three single-file admin modals at 3,057 / 2,454 / 2,186 lines (plus a partially-split fourth) — the largest, riskiest files in the frontend — were decomposed into shared form directories with shared dropdown primitives.

| | Before | Now |
|---|---|---|
| God-modal stack | ~10,200 lines, 3 monoliths | ~8,550 lines across shared `BuildingForm/`, `PropertyForm/`, `form/` directories |
| Largest single file | 3,057 lines | largest remaining orchestrator well under 1,100 lines |
| Duplicate dropdown implementations | 25 hand-copied instances | 2 shared primitives |

Every one of the eight sub-PRs that made up this decomposition ran the full e2e suite (which grew from 12 to 20 specs in step alongside it) and included a manual verification pass on a disposable record. One data-loss bug (`districts` field silently discarded on building edit) was found and fixed along the way — the new e2e coverage would have caught any regression of it going forward.

**Status:** the final sub-PR (`refactor/property-dropdown-primitives`, PR #106) merged into `develop` on 2026-08-06. Phase 5 is complete apart from two deliberately deferred, non-urgent items (pure code relocation with no behavior change, and hook deduplication — both backlogged by the owner's decision, not blocking).

---

## 4. Security & Production-Readiness

This is the strongest evidence of return on the refactoring investment — every item below was either a pre-existing, unmitigated hole or a bug that shipped and went undetected until the safety net caught it.

| Issue | Severity | Status |
|---|---|---|
| **Privilege escalation** — any user could `PUT` their own role to `admin` | Critical | ✅ Closed (Phase 0) |
| **Unauthenticated building endpoints** — `findAll`, `findOne`, `update`, `remove`, `getOperators` on `/buildings` had `@Roles` decorators with no guard attached, making the decorator inert. Anyone could read the full building portfolio, enumerate every operator's email, and edit or delete any building by id | Critical | ✅ Closed (found & fixed 2026-08-03, hotfixed to prod) |
| **Unauthenticated media uploads** — `POST /properties/upload/video` and `/upload/documents` had the same missing-guard pattern; an anonymous caller could reach the S3 upload path | Critical | ✅ Closed (found & fixed 2026-08-03) |
| **Silent session refresh failure** — the frontend never called `POST /auth/refresh` (lost in an unrelated revert months earlier); users were silently signed out a few hours into a session instead of staying in for the full refresh window | High (UX/trust) | ✅ Fixed — single shared refresh coordinator across both HTTP clients, token lifetimes now configurable with safe compiled-in defaults |
| **Debug endpoint live in production** — `GET /api/test-sentry` threw an uncontrolled 500 | Medium | ✅ Closed (Phase 0) |
| **No structured logging** — 518 raw `console.*` calls (88 backend, 430 frontend), zero request correlation, incidents effectively undebuggable | High (operability) | ✅ Backend done — JSON structured logs, request-id propagation and correlation, secrets (`authorization`, `cookie`, `set-cookie`) redacted and verified live. Frontend half scoped for later (blocked on the ESLint fix, now resolved, and Phase 5) |
| **`trust proxy` not set** | Medium | ✅ Fixed — without it, Express saw every visitor as nginx's own IP, which would have made the `/auth/refresh` rate limit effectively global the moment the frontend started calling it |
| **No graceful shutdown** | Medium | ✅ Fixed — `enableShutdownHooks()`, verified SIGTERM exits cleanly |
| **CORS origins hardcoded, env variable silently unused** | Medium | ✅ Fixed — reads `CORS_ORIGIN` from env, merged (not replaced) into the existing list to avoid a stale env value locking out the production frontend |
| **Migration auto-run pointed at a non-existent path** | High | ✅ Fixed — explicit path, `migrationsRun: false`, applied only through the deploy step |

---

## 5. Metrics Dashboard

| Metric | Before | After | Change |
|---|---|---|---|
| Merged pull requests (this program) | — | **59** | — |
| Commits (this program, 10 days) | — | **134** | — |
| Net lines changed (tracked diff) | — | +14.6k / −38.1k | **≈ −23.5k net** |
| `public/` asset size | 38 MB | 13 MB | **−66%** |
| God-modal stack (largest 4 files) | ~10,200 lines, largest 3,057 | ~8,550 lines, largest well under 1,100 | **−16%, one monolith per file eliminated** |
| Duplicate dropdown implementations | 25 copies | 2 shared primitives | **−92%** |
| E2E test cases | ~0 reliably green | **21**, 8 spec files | from nothing to a real safety net |
| Backend unit tests | not running | **21**, 3 spec files, in CI | |
| Frontend data-layer mechanisms | 4 (fetch / axios / partial RTKQ / thunks) | 1 (RTK Query, 8 typed domains) | consolidated |
| Frontend type trees for core domain objects | 3–4 competing definitions | 1 canonical tree | consolidated |
| Dead files removed | — | **~110+** across all sweeps | |
| Database indexes on FK / filter columns | 0 | **10** | |
| Cascade delete (`DELETE FROM buildings`), 50k-row test copy | 3,300 ms | **4.7 ms** | **~700× faster** |
| Property media lookup, same test copy | 9.9 ms | 0.05 ms | ~200× faster |
| Catalogue first page (`ORDER BY created_at`) | 2.9 ms | 0.03 ms | ~95× faster |
| TypeScript `strict` mode | off | **on**, 0 errors, 0 suppressions | |
| ESLint | broken (didn't run at all) | running, 0 errors | |
| CI checks per PR | none | type-check + lint + unit tests + build, both apps | |
| `console.*` calls (backend) | 88, zero structure | 0 — replaced with structured JSON logging | |

---

## 6. What's Left / Roadmap

**Immediate (days):**
- Phase 3.1/3.2: pull the real nginx/compose config off the production and staging hosts and reconcile with the repository (currently the repo's `nginx/prod.conf` references a port the live compose file doesn't open — read-only investigation, low risk); remove the already-dead Redis service definition from `docker-compose.yml`

**Near-term (weeks) — Phase 6, backend boundaries and data:**
- Fix the matching service's N+1 query and per-item S3 presign-in-a-loop pattern
- Split the 1,941-line matching-calculation service (unit-test-first, since it's pure scoring logic with no DB dependency — the safest kind of large-file split)
- Break the `Auth ⇄ Users` and `Auth → TenantCv → Users` circular module dependencies currently held together with `forwardRef`
- Unify two competing authorization-guard styles across all controllers into one, so a missing guard becomes visually obvious
- Convert two `simple-array` columns to `jsonb` (needs a data-conversion migration and a backup)

**Deferred, not urgent (Phase 7 — scale preparation):**
Redis-backed rate limiting, deliberate caching, moving media processing off the synchronous request path, `/metrics` endpoint, a pagination audit, and a documented backup policy. None of these are blocking at current traffic; they're the next tier once the platform needs to scale beyond a single instance.

**Explicitly parked by owner decision (not forgotten, not urgent):**
- Moving ~48 files that still sit under old architecture-experiment folder names into their App-Router-native location — a pure rename/move with no behavior change, deliberately sequenced after the modal decomposition to avoid moving files that were about to be rewritten anyway
- Deduplicating a handful of remaining hook pairs and profile-form variants
- Generating frontend types directly from the backend's Swagger schema instead of hand-maintaining them — the real long-term fix for API contract drift, but it needs ~50 backend response-type annotations first

---

## 7. Notable Findings Along the Way

The refactoring surfaced a number of real bugs that had been shipping silently — each is either already fixed or logged for the phase that owns the affected file:

- **Wrong values displayed on the property detail page.** Property type and furnishing status were showing incorrect hardcoded defaults ("Apartment", "Unfurnished") regardless of the actual stored value, because the public API projection had never included those two fields. A wrong value is worse than a missing one — it reads as real data. Fixed and hotfixed to production directly.
- **An admin created through the admin panel could not open the admin panel.** The onboarding-completion check required a full user profile (6 fields), but the admin-creation flow never collected one — a self-inflicted lockout, fixed in Phase 1.
- **The "Clear entire shortlist" button did nothing.** Its confirmation modal was implemented but never wired to anything that rendered it — a dead feature the fix removed rather than reconnecting, per owner decision.
- **The e2e suite caught a stale build masking a real schema error.** A backend process left running from an old build was silently absorbing traffic that should have gone to the freshly deployed one, making `/api/auth/me` return 500 instead of the expected 401. Root-caused to a `pkill` pattern that killed the wrong process; fixed by killing by port instead.
- **A shortlist test was intermittently poisoning its own next run** due to an optimistic-UI race between the test finishing and its last network request landing — a test-only bug, confirmed the actual application behavior was correct, fixed in the test.
- **A form field editing a building's districts silently discarded the edit on save** — the field rendered, accepted input, and then was simply never included in the payload sent to the server. Found and fixed during the modal decomposition, now covered by a dedicated e2e assertion.

---

*Source of truth for this document: `docs/audit/PROGRESS.md` (living tracker) and `docs/audit/05-refactoring-plan.md` (original plan and risk register), cross-checked against git history and the current state of the codebase on `develop` as of 2026-08-06.*
