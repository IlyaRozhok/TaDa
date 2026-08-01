# PROGRESS — living refactoring tracker

**Current step: 4.3 part 3** — `strict` on, the remaining errors cleared. In progress.

**Everything from PR #61 to #76 is merged.** Phases 0, 1, 2, 2A and 4 are closed; from Phase 3 we did 3.3 and 3.4, and 5.3a (deleting the unreachable frontend files) was brought forward out of 5.3.

**Two deliberate departures from the plan's order, both the owner's call (2026-08-01):** Phase 5 runs before the rest of 4.3 so that `strict` is not spent on code Phase 5 deletes, and the dead-code half of 5.3 ran before 5.1 for the same reason. The rest of 5.3 stays after 5.1 and 5.2.

**Phases 0 and 1 fully closed.**
- Phase 0: 0.1 (#48), 0.2 (#50), 0.3 (reconciliation on hosts), 0.4 (#51)
- Phase 1: 1.1, 1.2 (#53), 1.3 (#54), 1.3b (#55), 1.4 (#56), 1.5 (#57), 1.7 (#54)

**What we have as a safety net:** e2e 12/12 on stable `data-testid`, CI gates both deploys
(types + tests + build of both apps), `.env.example` and root README.

**Phase 2 closed.** Phase 2A closed: 2А.1 skipped by decision, 2А.2 (#63), 2А.3 (#64).

**Phase 0 fully closed:** 0.1 (PR #48), 0.2 (PR #50), 0.3 (reconciliation on hosts — pending = 0),
0.4 (PR #51, confirmed on stage: `No migrations are pending`, container healthy).
**Phase 1:** 1.1 closed with no repo changes (`npm ci` was enough), 1.2 — PR open, not merged.

**No blocking questions.** All owner answers received 2026-07-28:

| # | Status | Decision |
|---|---|---|
| Q1 | ✅ closed | The `operator` role has no frontend flow. We tear down operator-UI, no redirect target needed |
| Q2 | ✅ closed | **The SF Pro font is needed.** We keep `font-sf-pro`. We fix Tailwind via option (b) — tokens in CSS-first `@theme`, config removed |
| Q3 | ⏸ deferred until Phase 0.3 | DB schema on stage/prod — resolved by host access. Doesn't block the start |
| Q4 | ⏸ deferred until Phase 3.1 | Real compose/nginx on hosts — resolved by host access. Doesn't block the start |

---

## How to maintain this file

1. Before starting work — read this file top to bottom, find the first step
   with status ⬜ in the earliest unclosed phase. That is the current step.
2. Took a step into work → status **🟡**, set the start date.
3. Opened a PR → write the number/link into the **PR** column.
4. PR merged into `develop` and **verified on stage** → «Stage» column = ✅,
   step status = **✅**, date = merge date.
5. A step can't be started (waiting for an answer, waiting for the previous step) → **⛔** + reason in «Note».
6. Update the «Current step» line in the header.

**Statuses:** ⬜ todo · 🟡 in progress · ✅ done · ⛔ blocked · ➖ not a task (removed/moved/reference)
**Risk:** 🟢 safe · 🟡 verify on stage · 🔴 only after green e2e

**Rules that are easy to break here:**
- We **do not start** a phase until the previous one is closed. Exceptions — only those
  explicitly listed in «What can be run in parallel» in `05-refactoring-plan.md`.
- We **do not start** a 🔴 step without green e2e (step 1.3).
- One step = one PR. Don't merge them together.
- Numbering here is **1:1** with `05-refactoring-plan.md`. A new step appeared —
  first add it to the plan, then here.

---

## Hard dependencies (must not be violated)

```
0.3  →  before any schema changes
1.3  →  before 5.x and 6.3–6.5
2A.2 →  strictly before 2A.3 (otherwise 404 for operators)
2.1  →  before 5.3
5.1, 5.2 →  before 5.3
3.1  →  before 3.2 and before CI/deploy changes
```

Can be run in parallel: **6.1** (after Phase 1), **Phase 4** (in parallel with Phase 5),
**3.1** (read-only, can start immediately).

---

## Phase 0 — Security and schema integrity

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 0.1 | Close privilege escalation: `PUT /users/:id/role` → `@Auth("admin")`, remove self-check `req.user.id !== id`, role validation | 🟡 | ✅ | #48 merged | ✅ | 2026-07-28 | R1 closed. Merged into `develop`, verified on stage |
| 0.2 | Remove `GET /api/test-sentry` | 🟢 | ✅ | #50 merged | ✅ | 2026-07-28 | R17 closed. Merged into `develop`, verified on stage. Endpoint removed, no other references in the code |
| 0.3 | Reconcile `SELECT name FROM migrations` on stage and prod against the file list | 🟡 | ✅ | — (read-only) | ✅ | 2026-07-29 | R3 **closed.** PROD: 48 records = 48 files, 1:1, no drift. STAGE: 51 records / 50 files, all 50 recorded. The extra one — a ghost `AddRefreshTokenHashToUser1775100000000` (singular, no file; renamed to `...Users1785246923429` — that one is applied and has a file). **pending = 0 on both.** Prod is 2 migrations behind stage (`Backfill…`, `DropDuplicate…`) — a normal release lag. Cleaning up the ghost — out of scope, see «Noticed along the way» |
| 0.4 | `migrationsRun: false` + fix the migrations path in `typeorm.config.ts` | 🟡 | ✅ | #51 merged | ✅ | 2026-07-29 | R2 closed. Path via `join(__dirname, …)` → `dist/database/migrations`; `migrationsRun: false`, application only via the explicit `mig:run:prod` step. On stage: `No migrations are pending`, container healthy |

## Phase 1 — Safety net

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 1.1 | Fix the test run: `npm ci` in `backend/`, make sure `npm test` passes | 🟢 | ✅ | — (no repo changes needed) | n/a | 2026-07-29 | R6, part. **There was no defect in the repository:** `jest ^29.7.0`, `ts-jest`, `@types/jest` are declared in devDependencies and present in the lockfile, `jest.config.ts` is correct. The local `node_modules` had been installed with `--omit=dev`, hence «jest: not found». Cured by `npm ci`. Result: **2 suites, 13 tests, exit 0**. The remainder of R6 — tests not running in CI — is closed by step 1.4 |
| 1.2 | Fix the frontend `type-check` — broken `area.test.ts` (vitest not installed) | 🟢 | ✅ | #53 merged | ✅ | 2026-07-29 | R14, part. Installed `vitest ^4.1.10` (devDep), added a minimal `vitest.config.ts` (env `node`, `include: src/**`), scripts `test` / `test:watch`. `type-check` → **exit 0**, `npm test` → **1 file, 7 tests, exit 0**. Didn't touch the test — it passes as is |
| 1.3 | Bring e2e to green + write coverage for phases 4–6 | 🔴 | ✅ | #54 merged | ✅ | 2026-07-29 | **Base net raised: 12/12 green** against the local stack. Addresses moved out to `PLAYWRIGHT_BASE_URL` / `PLAYWRIGHT_API_URL`. `global-setup` rewritten without the backdoor: seeding via `psql` (fixed UUID, idempotent) + issuing an HS256 JWT with `JWT_SECRET` + `storageState`. Added an API spec — regression on R1. App code untouched. PR open, **not merged** |
| 1.3b | Harden e2e selectors via `data-testid` | 🟡 | ✅ | #55 merged | ✅ | 2026-07-31 | Added 9 attributes across 6 components (**attributes only, logic untouched**), 4 specs moved to `getByTestId`. Dropped bindings to `.cursor-pointer.group`, `button svg`, `table tbody tr` and to button text — Phases 4.1/5.3 will no longer break the net. **12/12 green.** PR open, **not merged** |
| 1.4 | Enable in CI: tests, type-check, build of both apps; Node 18 → 20 | 🟢 | ✅ | #56 merged | ✅ | 2026-07-31 | The `build-and-test` job split into `backend` and `frontend`, both deploy jobs depend on both. Added typecheck + unit tests + frontend build (previously the frontend wasn't checked in CI at all). Node 18 → 20 (as in the Dockerfile). PR trigger extended to `develop`. **Lint intentionally not enabled — owner's decision, option (a):** ⚠️ **frontend linting doesn't work at all** (discovered at 1.2). `npm run lint` = `next lint`, but in Next 16 there's no `lint` command in the CLI — it fails with «Invalid project directory: …/frontend/lint». A direct `npx eslint src` also fails: `TypeError: Converting circular structure to JSON` — ESLint 9.34 + `FlatCompat` with `next/core-web-vitals`. So `npm run quality` is broken too. Add the `lint` step to CI — after the fix in 4.3. Run confirmed: PR run and push run green, deploy-staging worked |
| 1.5 | `.env.example`, root README, banners on historical docs | 🟢 | ✅ | #57 merged | ✅ | 2026-07-31 | R19. Added `backend/.env.example` and `frontend/.env.example` — **the list is reconciled with the code**, unused variables moved into a separate block. Root `README.md`: topology, run, checks, flow, deploy, map of `docs/audit/`. Added `!.env.example` to `.gitignore` (otherwise the templates were cut off by the `.env*` rule). Banners on historical docs were done earlier. In the same PR — a «Language» section in CLAUDE.md |
| 1.6 | ~~Sort out branches~~ | — | ➖ | | | | Removed: we ignore old branches |
| 1.7 | Unify the onboarding guard on `onboardingCompleted` (option A) | 🟡 | ✅ | #54 merged | ✅ | 2026-07-29 | Found during 1.3. Guards were on `isOnboarded` = `isProfileComplete()`, but onboarding doesn't collect `address`/`nationality` → **an admin created through the admin panel couldn't open the panel**. Moved `SimpleDashboardRouter`, `dashboard/page`, `TenantUniversalHeader`, `UserDropdown`; removed the orphaned `selectIsOnboarded`. Added an e2e — verified that it fails on the old code. PR open, **not merged** |

## Phase 2 — Removing dead code

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 2.1 | Remove `src/components/` — 22 files, 0 imports | 🟢 | ✅ | #58 merged | ✅ | 2026-07-31 | Before removal, re-checked with the resolver: **0 incoming imports**. Reconciled against `shared/ui` — 7 diverging files sorted out, the single unique refinement (country flags in `CountryDropdown`) recorded in «Noticed along the way». Checks: type-check, build, 7 unit, **12/12 e2e**. Unblocks 5.3 |
| 2.2 | Remove the remaining dead files | 🟢 | ✅ | #59 merged | ✅ | 2026-07-31 | The list from the audit was re-scanned with the resolver on current `develop` — came out to **38 files** (19 from the audit + barrels orphaned after 2.1). Removed. **Cascade: another 29 files became unreachable** — this is FSD-layer untangling, assigned to 5.3 (see «Noticed along the way»). Checks: type-check, build, 7 unit, **12/12 e2e** |
| 2.3 | Remove dead frontend API methods (`/residential-complexes*` etc.) | 🟢 | ✅ | #60 merged | ✅ | 2026-07-31 | Drift re-reconciled with the resolver against 71 backend routes. Removed: `residentialComplexesAPI` (6 methods), `operatorsAPI`, `authAPI.getTempTokenInfo`, `usersAPI.update`/`getById` (no such method), `updatePropertyMedia`/`setAsPrimary`, the entire `shared/api/endpoints/auth.ts` file (4 nonexistent auth routes; imported only from a commented-out line). **Didn't touch `operatorAPI` — that's Phase 2A.** Checks: type-check, build, 7 unit, **12/12 e2e**. PR open, **not merged** |
| 2.4 | Operator dashboard | — | ➖ | | | | Moved to Phase 2A |
| 2.5 | Backend junk: `backend/database/`, `test-login.dto.ts`, broken npm scripts | 🟢 | ✅ | #61 merged | ✅ | 2026-07-31 | R21, R23. Removed the obsolete `backend/database/` migrations folder and the `COPY database ./database` line that shipped it into the image, the orphaned `test-login.dto.ts`, and three npm scripts pointing at files that do not exist. **The eight `*.old.txt` files were never in the repository** — `.gitignore:225` matches `*.txt`, so they were local-only artifacts; removed from the working tree, nothing to commit. Verified: tsc exit 0, 13 jest tests, build exit 0, **Docker image builds**. |
| 2.6 | Changelog fragments and `src/pages/` | 🟢 | ✅ | — (nothing left to delete) | ✅ | 2026-07-31 | **Already done by earlier steps, verified rather than assumed.** `src/pages/` disappeared when its only file, `README.md`, was archived during preparation — absent from disk and from the git tree. The dead onboarding component `OnboardingProfileStep.tsx` went in 2.2. The `ONBOARDING_*.md` changelog fragments are in `docs/archive/`, which is where the archiving decision put them. Two stale references to `src/pages` remain and belong elsewhere: a glob in `tailwind.config.ts` (4.1 deletes that file) and six commented-out imports in `shared/lib/performance/lazy-loading.ts`, itself part of the 29-file cascade assigned to 5.3. Verified: type-check exit 0, **12/12 e2e** |

## Phase 2A — Removing operator-UI

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 2A.1 | Neutralize `useOperatorDashboard`: remove 8 `console.log` and `Promise.allSettled` | 🟢 | ➖ | | | 2026-07-31 | **Skipped deliberately** (owner, 2026-07-31): the hook is deleted whole in 2А.3, so tidying it first buys nothing. The step existed to make breakage visible while the operator layer stayed; it does not, so there is nothing to make visible |
| 2A.2 | Remove `case "operator"` from routing (3 places) | 🟡 | ✅ | merged #63 | ✅ | 2026-07-31 | R5b. **Strictly before 2A.3.** Turned out to be **five** places, not three: the two extra ones are both guards on `/app/units` (`useEffect` + the render-level «Access Denied» branch) that bounced operators straight back to the operator dashboard — without them the step would have been a no-op and a 404 after 2А.3. The `units` render guard was caught by the new e2e, not by reading. In `simpleRedirect` the branch is remapped, not deleted (default leads to `/?needsRole=true`). Also dropped the `requiredRole === "admin" && userRole === "operator"` clause in `SimpleDashboardRouter`. Checks: type-check exit 0, 7 unit, **15/15 e2e**. PR open, **not merged** — awaiting staging |
| 2A.3 | Remove the frontend operator layer (2 pages, slice, 2 hooks, `operatorAPI`) | 🟡 | ✅ | merged #64 | ✅ | 2026-07-31 | R5. Removed: `dashboard/operator/page.tsx`, `dashboard/admin/operator/page.tsx`, `operatorSlice.ts`, `useOperatorDashboard.ts`, `useSuggestProperty.ts`, the `operatorAPI` block, the `operator` reducer key, the «Operator Dashboard» menu item — 1542 lines. Six links to the dead route redirected (create ×3, manage, edit, `usePreferences`), plus `SimpleDashboardRouter`'s `/app/dashboard/${userRole}` template, which pointed at a 404 for tenants too. `grep dashboard/operator` over `src` is empty. Checks: type-check exit 0, **16/16 e2e**. **PR open, must not be merged until a live operator is checked on staging** |
| 2A.4 | «DO NOT TOUCH» stop-list | — | ➖ | | | | Reference, check against during 2A.3 |
| 2A.5 | Server-side filtering for `operators/[id]` | — | ➖ | | | | To the backlog, not in this refactoring |

## Phase 3 — Infrastructure and observability

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 3.1 | Pull the real compose/nginx/env from prod and stage, record the discrepancies | 🟡 | ⬜ | | | | R8, question Q4. Read-only — can start immediately |
| 3.2 | Infrastructure cleanup: **remove redis from `docker-compose.yml`**, `REDIS_*` from env, `sharp` from the Dockerfile, `HEALTHCHECK` → `/api/health`, `frontend/Dockerfile*` | 🟢 | ⬜ | | | | R22. After 3.1. ⚠️ **Redis in compose is NOT removed** — the `chore/remove-redis-compose` branch was deleted without merging (2026-07-28). In `develop` the `redis` service, `redis_data` volume, and `depends_on` are still in place. The work has to be redone as part of 3.2 |
| 3.3 | Structured logger + request-id; strip `console.*`; Sentry on the frontend | 🟡 | ✅ | merged #65 + #66 | ✅ | 2026-07-31 | R9. **Backend half only** (owner's decision, 2026-07-31): the frontend half waits for 4.3 (broken ESLint) and Phase 5. Added `nestjs-pino` + `pino` + `pino-http` (`pino-pretty` in dev): JSON to stdout in prod, pretty in dev, access logs where there were none. `X-Request-Id` is reused from the proxy when sent and generated otherwise, and returned in the response. `redact` hides `authorization`, `cookie` and `set-cookie` — **verified by eye on a live 200 request**. `/api/health` is out of the access log. `SentryGlobalFilter` now logs 5xx with a stack and 4xx as a warning, both with the request id. All 16 application `console.*` replaced; the 72 in migrations left alone. Checks: build exit 0, 13 unit, **16/16 frontend e2e**. Merged (#65). **Hardened afterwards** (`chore/finish-logging-hardening`, PR open): each 5xx now produces exactly one error line, and the backend service has json-file rotation |
| 3.3b | Frontend half of 3.3: `console.*` and Sentry | 🟡 | ⬜ | | | | Split out of 3.3 by owner's decision. Blocked by 4.3 (ESLint) and touches files Phase 5 rewrites |
| 3.4 | Prod bits and pieces: `enableShutdownHooks`, CORS from env, `SWAGGER_*` in env | 🟢 | ✅ | merged #67 | ✅ | 2026-07-31 | `enableShutdownHooks()` before `listen`. CORS reads `CORS_ORIGIN` as a comma-separated list and **merges it into the previous hardcoded list instead of replacing it** — deliberate deviation from the brief, see the note below. `credentials: true`, methods and headers unchanged. `CORS_ORIGIN` moved out of the «no longer read» block in `.env.example`; the `SWAGGER_*` comment now states that production requires both. Checks: build exit 0, 13 unit, **16/16 e2e**, live CORS preflight and an authenticated cookie request from `http://localhost:3000`, SIGTERM exits cleanly. PR open, **not merged** |

## Phase 4 — Targeted frontend fixes

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 4.1 | Tailwind: move tokens into CSS-first `@theme`, remove `tailwind.config.ts` | 🟡 | ✅ | merged #68 | ✅ | 2026-07-31 | R11. **The step turned out to be smaller than the plan assumed, because the premise was wrong.** The plan said `font-sf-pro` gave no CSS and the font therefore did not work. The first half is true; the second is not — `globals.css` already sets the identical SF Pro stack twice, via `@theme inline { --font-sans }` (which feeds Tailwind v4's `--default-font-family` on `html`) and via an explicit `body` rule. So the font has been working all along and there was nothing to switch on; the class was pure decoration. Q2 stands — SF Pro stays — it simply never depended on this config. Done: deleted `tailwind.config.ts`, stripped 20 `font-sf-pro` and 2 `min-h-touch-sm`. **`@config` was rejected**: the ignored config redefines the spacing scale in `rem` while v4 computes it as `n × 0.25rem`, so enabling it would have quadrupled 131 spacing classes across the app. Checks: type-check exit 0, build exit 0, 16/16 e2e, and six before/after screenshots (3 pages × desktop+mobile) that are **byte-identical**. PR open, **not merged** |
| 4.2 **stage 1** | Delete unused images | 🟢 | ✅ | merged #69 | ✅ | 2026-07-31 | R20. **The «→ WebP/AVIF» in the title is wrong and the plan should not be followed literally** — see below. Deleted 24 files, **4.45 MB**; `public/` 38 → 33 MB. `ilya.png` (1.27 MB) was swapped for a 77 KB jpg — the owner had started that swap by hand, it is finished and committed here. Every file was grepped twice by bare name and public URL across 368 text files in `src/`, `e2e/`, `public/`, `next.config.ts`, `package.json`; dynamic construction was ruled out separately (no template-built local paths, no CSS `url()`, no `backgroundImage`). Checks: type-check exit 0, build exit 0, 16/16 e2e, landing screenshot with the team section expanded. PR open, **not merged** |
| 4.2 **stage 2** | Shrink the heavy images that are actually used | 🟡 | ✅ | merged #70 | ✅ | 2026-07-31 | **`public/` 33 → 13 MB, −20.5 MB.** Two parts. (1) The `<link rel="preload">` pair in the root layout is gone: `tenant-landing-bg.png` was preloaded on every route and **rendered nowhere** (deleted, 1.61 MB), and `tenant-hero-bg` is rendered by `<Image priority>`, which emits its own preload for the *optimised* URL — so preloading the raw PNG only ever fetched a second copy the page never used. That is 2.72 MB off **every page load**. (2) Eleven photographic sources converted to WebP q92; the four full-bleed backgrounds also capped at 1920px and `tada-stage` at 1536px, each at least 2× the width it is actually painted at (measured in the browser, not guessed). **Correction to the plan: lossless PNG re-encoding gains nothing here** — the sources are already well packed and re-encoding makes them *larger*. A first attempt looked like 68–85% savings until pixels were compared: `sharp`'s `effort` option silently implies `palette: true`, so it had been quantising photos to 256 colours (max sample delta 115/255, alpha dropped on one file). That attempt was discarded, not shipped. Quality verified numerically (mean absolute error 0.8–2.25 of 255) and by eye on side-by-side crops at display scale. Checks: type-check exit 0, build exit 0, 16/16 e2e, every converted asset 200 through next/image, old paths 404. PR open, **not merged** |
| 4.3 **part 1** | Repair the frontend ESLint so it runs at all | 🟢 | ✅ | merged #71 | ✅ | 2026-07-31 | R14. Cause found: `eslint-config-next@16` ships **native flat configs**, and `eslint.config.mjs` was feeding them to `FlatCompat`, i.e. to the legacy eslintrc loader, which crashed on `JSON.stringify` of mutually-referencing plugin objects (`Converting circular structure to JSON`). Fixed by importing the flat presets directly and dropping `FlatCompat` and the `@eslint/eslintrc` dependency. `next lint` was removed in Next 16, so the npm script now calls `eslint src e2e` directly. The dead `.eslintrc.json` and `.eslintrc.strict.json` are deleted, their useful rules folded into the flat config. **`npm run lint` now exits 0: 0 errors, 671 warnings** — see the note below for the breakdown. Checks: lint exit 0, type-check exit 0, build exit 0. PR open, **not merged** |
| 4.3 **part 2** | Tighten tsconfig | 🟡 | ✅ | merged #72 (groundwork) (groundwork only) | ✅ | 2026-08-01 | **Correction: the earlier «`strict` costs only 14 errors» figure was wrong** — it came from a probe with its own `include`, which under-reported. Re-measured against the project's real `tsconfig.json`: baseline **0**, `noImplicitAny` **76**, `strictNullChecks` **123**, `strict` **136**. The counts roughly add up, so the plan's per-flag approach was right after all and there is no discount for turning everything on at once. This PR does **not** enable `strict`; it removes 99 of the 136 blockers with real fixes and leaves the flag off so the branch is green. **37 errors remain**, concentrated in `NewPreferencesPage` (10), `EditBuildingModal` (8), `EditPropertyModal` (4) and about a dozen single-error files. Checks: type-check exit 0, build exit 0, lint exit 0, 16/16 e2e |
| 4.3 **part 3** | Finish the remaining 37 and switch `strict` on | 🟡 | ⬜ | | | | The rest are contract mismatches rather than missing guards: step-component prop types in `NewPreferencesPage`, nullable form state in `EditBuildingModal`, and mock objects in `EditPropertyModal` that do not satisfy `User`. Each needs a decision about the type one level up, so they do not fit in one sweep |

## Phase 5 — Frontend consolidation

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 5.1 | One data layer → RTK Query; one PR per domain | 🔴 | ⬜ | | | | R13. Before 5.3 |
| 5.2 | One type tree; consider generation from Swagger | 🔴 | ⬜ | | | | R12. Before 5.3 |
| 5.3a | **Delete the unreachable frontend files** (split out of 5.3, brought forward) | 🟢 | ✅ | merged #76 | ✅ | 2026-08-01 | Reachability from the 34 App Router entry points: 317 files, 266 reachable, **50 deleted (−5344 lines)**. Re-running the analysis afterwards leaves **zero** new orphans, so the cascade is closed rather than shifted. The vitest file `shared/lib/__tests__/area.test.ts` is unreachable from the app but tests a live module, so it stays. Two grep «hits» were name collisions, not references: `ProfilePageSkeleton` vs `PageSkeleton`, and `SelectField` from `shared/ui/FormField` vs the preferences one. Checks: type-check exit 0, lint exit 0, build exit 0, 7 unit, **16/16 e2e** |
| 5.3 | One architecture — App Router native; merge the three `ui`s, sort out FSD layers | 🔴 | ⬜ | | | | R12. After 2.1, 5.1, 5.2 |
| 5.4 | Break up the god-modals (3057 / 2454 / 2186 lines) | 🔴 | ⬜ | | | | R16. **The riskiest task in the plan** |
| 5.5 | Deduplicate hooks and profile forms | 🟡 | ⬜ | | | | |

## Phase 6 — Backend: boundaries and data

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 6.1 | Indexes on all FKs + matching filter columns, `CREATE INDEX CONCURRENTLY` | 🟢 | ⬜ | | | | R4. **The cheapest win.** Can be done in parallel after Phase 1 |
| 6.2 | Matching: remove N+1 and S3 presign in the loop, align the two read paths | 🟡 | ⬜ | | | | R15 |
| 6.3 | Split `matching-calculation.service.ts` (1941 lines), unit tests first | 🔴 | ⬜ | | | | Domain documentation will appear as a byproduct |
| 6.4 | Break the module cycles Auth ⇄ Users and Auth → TenantCv → Users | 🔴 | ⬜ | | | | R10 |
| 6.5 | Unify the guards — keep only `@Auth` | 🟡 | ⬜ | | | | Affects all controllers |
| 6.6 | `simple-array` → `jsonb` with data conversion | 🟡 | ⬜ | | | | R18. Needs a backup and a check on a copy of prod data |
| 6.7 | Entity ownership: distribute across owner modules | 🟡 | ⬜ | | | | Do last — affects all imports |
| 6.8 | Persist onboarding completion on the server (option B) + harden the flow itself | 🟡 | ⬜ | | | | An `onboarding_completed` column + migration + returning it in `/auth/me`; clean out `isOnboarded`/`setIsOnboarded`/`isProfileComplete` as a guard. Right now the flag is only in `localStorage` — **on another device the user lands back in onboarding**. **Also here — two findings from 2026-07-29** (see «Noticed along the way»): (1) an honest completion signal instead of «the `preferences` row exists»; (2) disable «Next» until the required fields are filled in, including nationality. Analyzed, design proposed, implementation deferred by the owner. After 1.7 |

## Phase 7 — Preparing for scale

| Step | Description | Risk | Status | PR | Stage | Date | Note |
|---|---|---|---|---|---|---|---|
| 7.1 | Throttler in Redis (if Redis comes back) | 🟡 | ⬜ | | | | R7. Right now the counters are in process memory |
| 7.2 | Cache — bring Redis back deliberately, for specific scenarios | 🟡 | ⬜ | | | | |
| 7.3 | Queues — move media upload to S3 out of the HTTP handler | 🟡 | ⬜ | | | | |
| 7.4 | Metrics — `/metrics` or APM | 🟢 | ⬜ | | | | Right now visibility is zero, apart from Sentry |
| 7.5 | Pagination — check all listings | 🟡 | ⬜ | | | | |
| 7.6 | DB backup policy — lock it down and document it | 🟢 | ⬜ | | | | |

---

## Noticed along the way

Improvement candidates found while working on the steps. **We don't fix them opportunistically** —
each one goes into the phase that owns the file, and only after Phase 1 (see CLAUDE.md, «Where the cleanup boundary is»).

| Date | Where | What we noticed | Where it belongs |
|---|---|---|---|
| 2026-07-28 | `user-role.service.ts` | `updateUserRole` reads the user with `relations` twice — before and after the transaction | 6.2 (backend perf) |
| 2026-07-28 | `users.controller.ts` | The `PUT :id/role` route is now on `@Auth`, the other admin ones — on `@UseGuards + @Roles`. Two styles in one file | 6.5 (guard unification) |
| 2026-07-28 | `frontend/src/app/lib/api.ts` | Dead groups remain: `operatorAPI`, `residentialComplexesAPI`, `operatorsAPI` — they call nonexistent routes | 2.3 / 2A.3 |
| 2026-07-29 | DB stage, table `migrations` | A ghost record `AddRefreshTokenHashToUser1775100000000` — no file, the migration was renamed. Doesn't affect pending (`ADD COLUMN IF NOT EXISTS`), but the stage↔prod discrepancy will remain until the row is removed | separate DB-hygiene task, not Phase 0 |
| 2026-07-29 | `frontend`, ESLint | Frontend linting doesn't work: `next lint` was removed from the CLI in Next 16, and `npx eslint` fails on `FlatCompat` + `next/core-web-vitals` (`Converting circular structure to JSON`, ESLint 9.34). `npm run quality` is broken as a result. Pre-existing, found during 1.2 | 1.4 (CI) / 4.3 (ESLint rules) |
| 2026-07-29 | `src/shared/lib/__tests__/area.test.ts` | Import `from "../area"` — going up the tree, by our rule it should be the alias `@/shared/lib/area`. Didn't touch: the line isn't in the step's diff | 4.3 / separate alias task |
| 2026-07-31 | `.github/workflows/deploy.yml` | `actions/checkout@v4` and `actions/setup-node@v4` run on the Node 20 runtime, which GitHub declared deprecated — two warnings per run. Cured by bumping to `@v5`. Has nothing to do with our `node-version: 20` (the app version) | minor, separate PR or alongside 4.3 |
| 2026-07-31 | `frontend/src` | **Cascade after 2.2:** removing 38 dead files makes another **29** unreachable — mostly barrels and the internals of FSD layers (`features/*/lib\|model\|ui/index.ts`, `widgets/*/index.ts`, `shared/api/endpoints/properties.ts`, `shared/hooks/useUserProfile.ts`, `types/{api,booking,building,tenantCv}.ts`, 7 dropdowns in `preferences/ui`). Didn't remove: this is already a structural FSD untangling, not a «dead file from the list», and the cascade may continue. Full list — in the diff of the 2.2 run | 5.3 |
| 2026-07-31 | `src/app/properties/[id]/test/page.tsx` | A test artifact that made it to prod: this is a **live route** `/properties/[id]/test`, so I didn't touch it in 2.2 — removing a route is a behavior change, not dead-code cleanup. The neighboring `test-page.tsx` (not a route) was removed | owner's decision |
| 2026-07-31 | `shared/ui/CountryDropdown` | The removed copy `src/components/ui/CountryDropdown` had **country flags** (`{country.flag}` in the list and next to the selected value), the live component doesn't have them — even though the `flag` field in `shared/lib/countries.ts` is filled with emoji. Users never saw the flags: the copy wasn't imported. The implementation remains in git history (the 2.1 removal commit). If flags are needed — that's a separate UI task | UI backlog |
| 2026-07-31 | `backend/src/` | Eight `*.old.txt` files inside `src`: `matching-enhanced.service`, `matching-enhanced.controller`, `shortlist.controller`, `shortlist.service`, `matching-media.service`, `matching-filter-enhanced.service`, `matching-notification.service`, `matching-calculation-enhanced.service`. They don't compile, but they sit in the source tree and confuse search | 2.5 (backend junk) |
| 2026-07-31 | `backend/.env` on the hosts | Variables not read by a single line of code: `CORS_ORIGIN`, `BCRYPT_ROUNDS`, `SESSION_CLEANUP_INTERVAL`, `MAX_SESSIONS_PER_DEVICE`, `JWT_REFRESH_EXPIRES_IN`, `REDIS_*`. Recorded in a separate block in `.env.example` | 3.2 |
| 2026-07-29 | onboarding: `SessionManager` + `usePreferences` | **A hole in the completion flag.** `SessionManager:43-49` sets `onboardingCompleted=true` based on the existence of a `preferences` row, and `usePreferences.saveSingleField:437-439` creates that row on the **very first filled field**. Scenario: filled one field → reloaded → onboarding marked as passed with an incomplete profile, and `onboarding/page.tsx:227` pushes to `/app/units` — you can't go back and finish, the drafts in localStorage become dead weight. The hole is **older** than `265ec5e`: `/app/units` was gated by this flag since PR #46 | 6.8 |
| 2026-07-29 | `useUnifiedProfile.ts:151-162` | **«Next» is active without the required fields.** On the profile step (4) all 6 fields render (`first_name`, `last_name`, `address`, `phone`, `date_of_birth`, `nationality`), but `validateForm` checks only `first_name`, `last_name`, `date_of_birth` + age. Nationality, address, and phone can be skipped. In the preferences phase there's just one gate — on the 10th step | 6.8 |
| 2026-07-29 | `src/database/migrations/` | Of 50 migrations, only 14 are protected by `IF (NOT) EXISTS`, 36 will fail on re-application. As long as pending = 0 it doesn't matter, but any table-vs-files discrepancy will become a failure | 6.x / DB hygiene |

| 2026-07-31 | `frontend`, vitest | **No vitest config at all**, so no path-alias resolution: any unit test that pulls in app code dies on `Cannot find package '@/store/slices/authSlice'`. Wrote a `getRedirectPath` test during 2А.2, could not run it, removed it. That leaves `simpleRedirect` covered by review and staging only — e2e cannot reach it, it runs after Google login | 4.3 / test tooling |
| 2026-07-31 | `SimpleDashboardRouter.tsx` | On denial it redirects to `` `/app/dashboard/${userRole}` `` — a template over a role name. `/app/dashboard/tenant` does not exist, so a tenant hitting an admin screen already lands on a 404 today. Pre-existing, not caused by 2А.2; `/app/dashboard/operator` joins it after 2А.3 | 2А.3 / 6.5 |
| 2026-07-31 | `SimpleDashboardRouter.tsx` | The `useEffect` role check and the render-level one had **different rules** — the effect granted operators admin screens, the render guard did not. Net effect was a blank page, never the admin panel, so the access widening never actually worked. Unified in 2А.2; the two checks are still duplicated and can drift again | 6.5 (guard unification) |

| 2026-07-31 | `frontend/src/app/app/properties/manage`, `create` | The «Back to Dashboard» buttons pointed at the operator dashboard. Retargeted at `/app/units` in 2А.3 and **relabelled to «Back to Units»** — a visible copy change, small but not silent: leaving the old label over a new destination would be worse | done in 2А.3, flagged for the owner |
| 2026-07-31 | `DashboardHeader.tsx` | The admin navigation block was rendered for `admin \|\| operator`. After 2А.2 an operator is refused the admin panel, so two of its three remaining items led nowhere useful; the block is now admin-only. Operators keep the ordinary menu | done in 2А.3, flagged for the owner |
| 2026-07-31 | `frontend/src/app/app/properties/*` | The property create/edit/manage flow is still shared by admins and operators and is guarded by `getUserRole(user) !== "operator" && !== "admin"` in each page separately. Nothing here was removed — the role keeps its property rights — but the guard is copy-pasted three times | 6.5 (guard unification) |

| 2026-07-31 | `docker-compose.yml` on the hosts | ~~**Log volume grows with 3.3**, and the json-file driver rotates nothing.~~ **Closed for the backend service**: `logging: json-file, max-size 10m, max-file 3` — a hard cap of 30 MB. The redis service is left without one on purpose; it belongs to the deferred 3.2, which owns that file | closed for backend · redis stays in 3.2 |
| 2026-07-31 | `sentry-exception.filter.ts` | ~~**5xx are logged twice.**~~ **Fixed:** our line is written only for an `HttpException`, which is precisely what Nest's `BaseExceptionFilter` refuses to log; everything else is left to Nest, whose line carries the request under `req` anyway. Verified live — a `QueryFailedError` produces one error line, was two | closed |
| 2026-07-31 | `s3.service.ts` + `property.controller.ts` / `building.controller.ts` | **One failed upload writes four error lines**: S3Service logs it, the inner controller `catch` logs and rethrows a plain `Error`, the outer `catch` logs again, then the filter layer logs once more. Pre-existing shape, only made visible by 3.3 — the `console.error` calls did the same. Also means the controller replaces `InternalServerErrorException` with a bare `Error`, so the filter's own 5xx branch is currently unreachable from any route | 6.x (error handling in upload flows) |
| 2026-07-31 | `sentry-exception.filter.ts` | `@sentry/nestjs` v10 exports its own `SentryGlobalFilter`; ours is a hand-written class with the same name. Worth checking whether the package one covers the case before maintaining a copy | 6.x |

| 2026-07-31 | `backend/.env.production` (local, gitignored) | **`CORS_ORIGIN=http://localhost:3000`** — a stale single value from before the origin list was hardcoded. Had 3.4 honoured the variable as a replacement, the first production deploy would have cut the allowed origins down to localhost and the frontend on ta-da.co would have been CORS-blocked outright. This is why the implementation merges instead. **Fix the value on the hosts, then the merge can become a plain replacement** | 3.1 (host reconciliation) → then simplify 3.4 |
| 2026-07-31 | `backend/.env.production` (local, gitignored) | `SWAGGER_USER` and `SWAGGER_PASSWORD` are **absent entirely**, while `main.ts` compares submitted basic-auth credentials against them directly. With both undefined the comparison can never succeed, so `/api/docs` answers 401 to everyone in production. Documented in `.env.example`; setting real values is a host change | 3.1 / ops |
| 2026-07-31 | stage checklist for 3.4 | After deploying: confirm the frontend still reaches the API (CORS), and that `CORS_ORIGIN` on the hosts lists the real frontend origins. With the merge in place an unset or stale variable is harmless — behaviour equals today's | 3.1 |

| 2026-07-31 | `UniversalHeader.tsx`, `buildings/[id]/page.tsx` | **`p-0.75` renders as 3px, not the 12px the old config meant.** Tailwind v4 computes spacing as `n × 0.25rem`, so `p-0.75` = 0.1875rem; the ignored `tailwind.config.ts` declared `'0.75': '0.75rem'` = 12px. 9 usages (5 `p-0.75`, plus `gap-0.75`). Almost certainly written against v3 expectations. Left untouched in 4.1 on purpose — going to 12px quadruples the padding in the header and on the building page, which is a design call, not cleanup. **Ask design: bug or intentional?** If it is a bug the fix is `p-3`, with a screenshot review | backlog — design |
| 2026-07-31 | typography, product-level | **SF Pro only renders on Apple devices.** There is no `@font-face`, no `next/font` for it and no font file in the repo — the stack falls through to `Helvetica Neue` and then the system sans, so Windows and Android users see Segoe UI / Roboto. That is today's behaviour and no Tailwind change alters it. Apple licenses the family for use on its own platforms, so self-hosting the files is not a developer decision. Matching typography everywhere means picking an openly licensed face with similar metrics — Inter is the usual stand-in for SF — and wiring it through `next/font`. Needs product and design, and a budget | backlog — product |

| 2026-07-31 | `auth/callback/page.tsx`, `simpleRedirect.ts` | ~~Redirects to `/?needsRole=true` that nothing reads.~~ **Closed** (`refactor/remove-dead-needsrole`): all three producers now send the user to `/`, which is where the ignored parameter left them anyway. **Still open and larger:** the branch that produced one of them is unreachable end to end — `callback/page.tsx:62` fires on `needsRoleSelection && registrationId`, and the backend never sends either parameter (`auth.controller.ts` only ever redirects with `success`, `error` or `details`). Inside it, `sessionStorage.setItem("googleRegistrationId")` is written and read by nobody. So a Google sign-up that genuinely has no role has no screen to pick one on. Deleting the branch is a behaviour question about the OAuth flow, not cleanup — left for the owner | product / 6.x |
| 2026-07-31 | `hooks/useOnboarding.ts:74` | Parameter `isGoogleAuth: boolean = false` — no caller ever passes it. Its only related producer was the `isGoogleAuth=true` query string dropped with `needsRole` | 6.x |

| 2026-07-31 | `<Image quality={85\|90\|95}>` in 7 places | Next 16 only serves the qualities listed in `images.qualities`, which defaults to `[75]`. Next clamps the URLs it generates itself, so nothing is broken — but the prop is **silently ignored** everywhere: the hero backgrounds and the property `ImageGallery` (90 and 95) all come out at quality 75. Either add `qualities: [75, 85, 90, 95]` to `next.config.ts` or drop the props, so the code stops promising something it does not get. Pre-existing — confirmed by building develop and requesting the same URL | 4.x / next.config |

| 2026-07-31 | frontend lint, 671 warnings | Breakdown now that lint runs: `@typescript-eslint/no-explicit-any` **289**, `no-unused-vars` **200**, `@next/next/no-img-element` **54**, `react/no-unescaped-entities` **53**, `react-hooks/set-state-in-effect` **31**, `exhaustive-deps` **23**, `use-memo` **11**, the rest in single digits. All set to `warn` deliberately: the step's goal was a lint that runs and passes, not a red CI. Only `react/jsx-key` and `no-var` are errors, and both are already clean | 4.x — burn down per rule |
| 2026-07-31 | `src/app/app/admin/panel/page.tsx:894` | **`useState` is called conditionally** — the one real `react-hooks/rules-of-hooks` violation (the other five were Playwright fixtures whose `use` callback the plugin mistakes for the React hook; that rule is off for `e2e/**` now). This is a genuine React correctness bug: hook order can change between renders. Left as a warning rather than blocking every build, but it should be fixed on its own | 4.x / bug |

| 2026-08-01 | `properties/[id]/page.tsx`, `buildings/[id]/page.tsx` | **Two latent null-dereference crashes**, found by turning `strict` on and fixed here. Both pages guard for loading, error and not-found, but all three guards only fire once the request has settled — a refetch with no data yet fell through to a body that reads `property.building_type` / `building.logo` directly and threw. Both now return the skeleton the first load already uses | fixed in 4.3 part 2 |
| 2026-08-01 | `src/types/tenantCv.ts` | Byte-identical duplicate of `src/app/types/tenantCv.ts`; all three importers use the latter. Part of the FSD cascade | 5.3 |

| 2026-08-01 | **bugfix, outside the phase numbering** — `property.response.ts`, `properties/[id]/page.tsx` | Detail page showed **Property Type «Apartment»** and **Furnishing «Unfurnished»** for a property stored as `flat` / `furnished`. Neither the value maps nor saving were at fault — the database row is correct and the maps translate both values. **Root cause: `toPublicProperty` is a whitelist projection that never included `property_type` or `furnishing`**, so `GET /properties/public/:id` omitted them, the page received `undefined` and fell into hardcoded defaults: the first entry of the property-type list («Apartment») and `furnishingCount[1]` («Unfurnished»). A wrong value is worse than a blank one because it reads as data the operator entered. Both fields are now exposed, and nine invented fallbacks were removed (`N/A`, `£0`, «Not specified», «Excluded») — an empty field renders empty, and «Excluded» appears only when the data says so. Shipped to `main` first (hotfix, merged), then cherry-picked here | done on main + develop |

| 2026-08-01 | e2e safety net | **The red suite was not an environment quirk.** `/api/auth/me` answered **500, not 401**, on `column User__User_tenantProfile.full_name does not exist`. The column was dropped by migration `1785250907864-DropDuplicateProfileIdentityColumns` and `develop`'s entity agrees — but a **backend process built from `main` was still holding port 5001**, and `main`'s entity still declares that column. `pkill -f "nest start"` killed the wrapper, not the listener, so every restart silently lost the port and kept talking to the stale build. Killed via `lsof -ti tcp:5001` → **16/16 green**. Lesson: kill by port. **Worth checking before the next release to `main`: if production runs today, that migration is probably not applied there** | 3.1 (host reconciliation) |

## Summary

| | Total | ⬜ todo | 🟡 in progress | ✅ done | ⛔ blocked | ➖ not a task |
|---|---|---|---|---|---|---|
| Steps | 54 | 23 | 0 | 26 | 0 | 5 |

Not tasks: 1.6 (removed), 2.4 (moved to 2A), 2A.1 (skipped — absorbed by 2A.3), 2A.4 (stop-list), 2A.5 (backlog).
