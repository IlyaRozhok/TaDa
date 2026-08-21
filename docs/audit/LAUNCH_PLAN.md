# LAUNCH_PLAN — the minimal bar for going live

**Written:** 2026-08-11 · **Against:** `origin/develop` @ `399842f` (Phase 6 closed)
**Target:** first real users on **ta-da.co** (`main`), ~1–2 weeks out.

This document answers one question: **what is the smallest set of work that lets us open
the doors without a foreseeable data-loss, security, or silent-breakage incident?**

It is not the backlog. Everything that is merely *better* is in §3, deferred on purpose.
The rule used to cut: an item stays only if its failure mode is **losing data**, **a
security hole**, or **breaking without anyone noticing**. Everything else was cut.

Context that shapes the whole plan:

- Prod runs `main` @ `d3d49a9` (Merge #74). `origin/develop` is **193 commits ahead**
  with **5 unapplied migrations**. The release is not incremental — it ships Phases 0–6
  in one shot.
- Prod is being **populated with real data right now**, but has **no live users**. That
  is a narrow window in which several otherwise-expensive fixes are nearly free
  (rotating `JWT_SECRET` logs out zero people; changing the onboarding gate strands zero
  people mid-wizard). It closes on launch day.

---

## 0. What changed since the prior assessment

Verified against current `develop`. Three of the earlier findings **no longer hold** and
are removed from the bar:

| Prior finding | Verdict on current `develop` |
|---|---|
| **P0-4 — `buildings.photos` stores presigned URLs, not re-signed on read** | **Does not hold.** Every building read path re-signs: `building.service.ts:300–303` (`updateBuildingMediaUrls`) is called by `findOneWithFreshUrls` (:310), `findAllWithFreshUrls` (:327) and `findOnePublic` (:347), which are the only three the controller routes to (`building.controller.ts:48, 71/75, 96`). The key extractor stops at the query string — `([^?]+)` in `s3.service.ts:103` — so it recovers the key correctly *from* a presigned URL. The presign cache TTL is 1h against a 24h signature (`s3.service.ts:23`), so cached URLs cannot be served near expiry. The 2026-08-09 note in `PROGRESS.md` («building photos are not refreshed») is **stale** — it was written against `refreshAvatarUrl` and missed the `refreshMediaUrls` path. Residual, not a blocker: `property.service.ts:308–312` refreshes an embedded `building.logo` but not `building.photos`; the property detail page does not use them — it re-fetches the building through the public endpoint (`app/properties/[id]/page.tsx:301`), which does re-sign. |
| **P1 — CORS allows localhost in prod** | **Real but not exploitable, demoted.** `cors.config.ts:5–11` does keep `http://localhost:3000/3001` in the prod allowlist. But the session cookies are `httpOnly` + `sameSite: "lax"` (`auth.controller.ts:16–18, 23–25`), so a cross-site XHR from a localhost origin carries **no cookie**. There is nothing to steal. Tidy it up post-launch. |
| **P1 — frontend lint is broken, can't go in CI** | **Stale.** `npx eslint src e2e` in `frontend/` now runs clean: **0 errors, 358 warnings**. The comment in `.github/workflows/deploy.yml:66–69` describing `next lint`/FlatCompat breakage no longer describes reality. |
| **P1 — nginx points at 3002 while compose opens 3001** | **Closed by step 3.1.** `nginx/prod.conf:47` proxies to `127.0.0.1:3001`; and the host's nginx is hand-managed anyway (the repo files are reference mirrors). |
| **P1 — `SWAGGER_USER`/`PASSWORD` missing → `/api/docs` 401s everyone** | **Closed by 3.1** — both are set on both hosts. |
| **Secrets committed to git** | **Never happened.** `git ls-files | grep env` returns only the two `.env.example` files; `infrastructure/terraform/terraform.tfvars` and `.tfstate` are untracked. Rotation is still on the bar (§1.10) but for hygiene, not because of a leak. |

Everything else from the prior assessment **stands and was re-verified**; citations are
inline below.

---

## 1. The minimal launch bar

Twelve items. Legend for **OWNER**: `code` = a coding session can do it ·
`host/ops` = the owner runs it on the server · `product` = the owner's call.

---

### Group A — nothing touches prod until these three are done (host/ops)

**These block the release. They are not code and cannot be parallelized away.**

#### 1. Take a prod DB backup and *prove the restore works*
**OWNER:** host/ops · **Effort:** 1–2h · **Status: 🟡 in progress — tooling shipped, host install and rehearsal outstanding**

`pg_dump` prod, restore it to a scratch database on the same host, and diff row counts
per table. A dump nobody has restored is not a backup.

**Shipped on `feat/db-backup` (2026-08-12), then reworked on
`feat/db-backup-sudofree`:** `scripts/db-backup.sh` and `scripts/db-restore.sh`, a
pre-deploy backup step in `deploy.yml` that **fails the production deploy if the dump
fails**, a one-click installer workflow (Actions → *Install DB backup*), and
`docs/ops/BACKUP_RUNBOOK.md` — including the rehearsal procedure this item and item 2
need.

**What the first install attempt taught us (2026-08-12).** The installer ran on prod and
**confirmed every inferred fact** — PostgreSQL **16.14** client and server, `tada_prod` /
`tada_user` / port 5432, password set, 38 G disk with 29 G free — then failed cleanly at
the package step on **`sudo: a password is required`**, before any writes. The host does
not give the deploy user passwordless sudo. Everything was reworked to need **zero root**:
the dump connects over **TCP as `tada_user`** with the password from `/opt/tada/.env`
instead of `sudo -u postgres`; the AWS CLI installs into `$HOME`; the systemd units were
deleted in favour of the **user crontab**; all state lives under `$HOME`. Note the one
real cost: cron has **no `Persistent=true` catch-up**, so a run missed while the host is
down is skipped rather than caught up.

**Still owner/ops, and still the gate:**
1. Secrets `BACKUP_AWS_ACCESS_KEY_ID` / `BACKUP_AWS_SECRET_ACCESS_KEY` — **already added.**
2. Re-run the *Install DB backup* workflow against `feat/db-backup-sudofree` (or `main`
   once merged). It needs no root and re-prints the facts.
3. **Before the rehearsal, one superuser action on the host console** (details in
   BACKUP_RUNBOOK §5.1): `ALTER ROLE tada_user CREATEDB;` and widen the `pg_hba.conf`
   line from `tada_prod` to `all` for `tada_user`. Without these, a restore onto a
   *scratch* database is rejected — the restore script detects both up front and prints
   the exact fix. Backups and a restore onto production are unaffected.
4. Do the restore rehearsal in §6 of the runbook and record the row-count diff. **That
   is what closes this item** — the tooling does not.

**Why:** the release runs 5 migrations onto a populated prod, and **the run is not
atomic**. `data-source.ts:44` sets `migrationsTransactionMode: "each"` — a failure in
migration 4 leaves 1–3 **committed**. Worse,
`1785801600000-AddPerformanceIndexes.ts:62` sets `transaction = false` (it must —
`CREATE INDEX CONCURRENTLY` cannot run in a transaction), so a failure inside *that one*
leaves partially-built invalid indexes with no rollback at all. The migration's own
header says so. Without a verified restore there is no floor under this.

#### 2. Rehearse the release against a copy of **prod's** schema
**OWNER:** host/ops (a coding session can drive it) · **Effort:** 2–4h

On the restored copy from #1, check out `develop`, build, and run `mig:run:prod`. Record
which migrations apply and how long each takes.

**Why:** stage cannot substitute. Stage and prod have *different migration histories* —
step 0.3 found prod at 48/48 records and stage at 51 records / 50 files with a ghost
entry. The specific landmine is `1785250907864-DropDuplicateProfileIdentityColumns`: the
same schema/entity mismatch already produced a **live 500 on `/api/auth/me`** locally on
2026-08-01 (`column User__User_tenantProfile.full_name does not exist`). A rehearsal is
the only thing that turns "should be fine" into "we watched it apply."

#### 3. Write the rollback runbook
**OWNER:** host/ops · **Effort:** 1h

Two paths, written down before they're needed:
- **Code-only rollback** — redeploy the previous `main` image. Safe *only if* no
  migration has run yet.
- **Post-migration rollback** — restore from #1. `git revert` on `main` does **not**
  undo a migration. If reverting migrations by hand,
  `1785801600000-AddPerformanceIndexes` needs `npm run mig:revert:prod:notx` (the
  `notx` variant), not the plain one — `DROP INDEX CONCURRENTLY` also cannot run in a
  transaction.

**Why:** "we'll figure it out" at 2am on a populated prod is how a bad deploy becomes a
data-loss incident.

---

### Group B — code (parallel with Group A)

#### 4. Migrate **before** serving new code
**OWNER:** code · **Effort:** 1–2h

**Not started.** `feat/db-backup` left a `TODO(LAUNCH_PLAN #4)` comment at the exact spot
in `deploy.yml` and deliberately did not touch the ordering — it depends on #5 and needs
the rehearsal from #2 first. The pre-deploy backup that branch added is what makes trying
it survivable.

`.github/workflows/deploy.yml:125–129` currently does
`up -d --no-deps backend` → `sleep 10` → `mig:run:prod`. Replace with: run migrations
first (a one-shot container on the new image), and only start serving on success —
`docker compose up -d --wait` gating on the healthcheck from #5.

**Why:** as written, new code serves against the **old schema** for at least 10s — and
**indefinitely** if the migration then fails, because nothing checks its exit status
against the already-running container. That is exactly the 500-on-`/api/auth/me` failure
mode from #2, live, on ta-da.co, with no alarm.

#### 5. Make `GET /api/health` touch the database
**OWNER:** code · **Effort:** 30m · **Status: ✅ done 2026-08-20 (#139)** — `/api/health` runs `SELECT 1` and answers 503 when the DB is unreachable.

`app.controller.ts:13–19` returns a static `{status, timestamp}`. Add a
`SELECT 1` (and, ideally, a check that there are no pending migrations).

**Why:** `docker-compose.yml:25` already wires this endpoint as the container
healthcheck, so today the healthcheck asserts only "Node is listening." It cannot tell
"app up" from "app up, database unreachable, schema wrong." #4 depends on this being
truthful — a gate that always passes is not a gate.

#### 6. Frontend error boundary + Sentry
**OWNER:** code · **Effort:** 3–4h

There is **no** `error.tsx`, no `global-error.tsx`, and no `ErrorBoundary` anywhere in
`frontend/src`, and no `@sentry/*` dependency in `frontend/package.json`.

**Why:** the backend is instrumented (`backend/src/instrument.ts`, `SentryGlobalFilter`).
The frontend is the blind half: any client render error today is a **blank white page**
with no message to the user and no report to anyone. In week one that means the owner
learns about breakage from a user, or not at all. This is the single largest
"can't-see-what-broke" gap.

#### 7. Remove the mock operators from the admin property form
**OWNER:** code · **Effort:** 30m

`frontend/src/app/components/EditPropertyModal.tsx:378–393` — when the operator list
comes back empty, the form silently substitutes two fabricated options with ids
`mock-op-1` / `mock-op-2` and submits them as `operator_id`.

**Why:** **this is the data-integrity item, and it is live on the exact path the owner is
using to populate prod right now.** A submitted `mock-op-1` is not a UUID: it either
500s (Postgres cast error) or, if it ever got through, writes a property pointing at an
operator that does not exist. Replace the fallback with an explicit "no operators
available" empty state.

#### 8. Stop the onboarding wizard from locking users out
**OWNER:** code (+ **product** on the completion definition) · **Effort:** 2–4h minimal

The mechanism, verified end to end:
- `frontend/src/features/preferences/lib/usePreferences.ts:507–528` auto-saves **each
  field** 500ms after it changes, so a `preferences` row with an `id` exists after the
  user touches **one** field.
- `frontend/src/app/utils/simpleRedirect.ts:81–95` treats `preferences.id` existing as
  "onboarding done" and routes past onboarding.
- `frontend/src/app/hooks/useOnboarding.ts:10` keeps wizard position in `localStorage`
  only.

So: a user fills one of twelve preference steps, refreshes or closes the tab, comes back
— and is redirected **permanently past onboarding**, with a near-empty preferences row
driving their entire matching feed. There is no path back.

**Minimal fix (recommended):** gate the redirect on a required field being populated
rather than on the row existing. ~10 lines, frontend-only, no migration. The full
server-side `onboarding_completed` column is step **6.8** in the plan and is deferred
(§3).
**Product call needed:** which field(s) constitute "onboarded."

**Why:** this hits **100% of first users** in week one and is unrecoverable from the
user's side. It is silent breakage of the primary funnel.

#### 9. Validate UUID route params
**OWNER:** code · **Effort:** 1–2h

There are **zero** uses of `ParseUUIDPipe` in `backend/src` against 12 `@Param("id")`
sites. Confirmed live (PROGRESS, 2026-08-08): `GET /tenant-cv/:share_uuid` answers
**500 "Internal server error"** on a non-uuid input; a well-formed unknown uuid
correctly answers 404. Add `ParseUUIDPipe` (or one shared pipe) to id params.

**Why:** the tenant-CV share link is a **public URL users hand to other people**. A
truncated or mistyped link shows "Internal server error." Secondarily — and this is the
real argument — every crawler and every mistyped link fills Sentry with 500s, and week
one is precisely when 500-noise has to stay low enough that a *real* 500 is visible.

---

### Group C — host configuration (do alongside Group A)

#### 10. Fix `JWT_REFRESH_EXPIRES_IN` on the prod host
**OWNER:** host/ops · **Effort:** 5m

Read the current value in `/opt/tada/.env`; then either set it to `30d` or delete the
variable so the code default wins (`auth-tokens.config.ts:16, 77`). Restart the backend.

**Why:** step 3.1 confirmed the variable **is set** on both hosts, and an env value
always beats `REFRESH_TOKEN_TTL_DEFAULT`. The local `.env.production` carries `7d`, the
likely host value. The silent-refresh bugfix shipped a 30-day session that production
does not actually give users — they get signed out ~4× more often than intended, on day
one, and it looks like the bug that was just fixed.

#### 11. Rotate the secrets
**OWNER:** host/ops · **Effort:** 1–2h

`JWT_SECRET`, `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, `GOOGLE_CLIENT_SECRET`,
`DB_PASSWORD`, and the Hetzner API token in the local `terraform.tfvars`.

**Why:** nothing leaked to git (verified), but these values have lived in plaintext
`.env` files through the whole development period and their exposure history is unknown.
The point is timing, not suspicion: rotating `JWT_SECRET` **now** invalidates zero
sessions; rotating it after launch signs out every user at once. This is the one moment
it is free. While in the file, also correct the stale `CORS_ORIGIN=http://localhost:3000`
if it is still there (harmless today because `resolveCorsOrigins` merges rather than
replaces, but it should not be the value).

---

### Group D — release day

#### 12. Run the e2e suite against stage as the release gate
**OWNER:** host/ops (manual) · **Effort:** 30m per run

`frontend/e2e/` has 9 specs / 23 tests and they pass. Run `npm run e2e` against
stage.ta-da.co before merging `develop → main`. **Use `--workers=1`** — the suite is
throttler-flaky at 5 parallel workers (PROGRESS, 2026-08-06: 90× HTTP 429 on session
bootstrap, not on the features under test).

**Why:** 193 commits go to prod in one shot. The e2e suite is the only automated proof
that auth, onboarding, matching, shortlist and admin all still work end to end — and it
already exists, so using it costs one command. (Update 2026-08-21: the smoke subset — auth, session-refresh, role-escalation, property-browsing, robots — now runs in CI and gates both deploys; the full suite against stage remains the manual step this item asks for.)

---

### Effort roll-up

| Group | Items | Effort |
|---|---|---|
| A — pre-prod ops | 1, 2, 3 | 4–7h |
| B — code | 4, 5, 6, 7, 8, 9 | 8–14h |
| C — host config | 10, 11 | 1.5–2h |
| D — release day | 12 | 0.5h + the deploy window |
| **Total** | | **~14–24h of focused work** |

---

## 2. Sequencing

### What blocks what

```
                    ┌─ 5 (health touches DB) ──┐
                    │                          ▼
  1 (backup) ──► 2 (rehearsal) ──► 3 (rollback) │  4 (deploy ordering)
       │                                        │       │
       └──────────► 10, 11 (host config)        │       │
                                                │       ▼
  6, 7, 8, 9 (independent code) ────────────────┴──► 12 (e2e green on stage)
                                                        │
                                                        ▼
                                                   RELEASE
```

- **#1 → #2 → #3** is a strict chain and the long pole. Start it **first**, today.
- **#5 → #4.** The deploy must gate on a healthcheck that means something; build the
  honest healthcheck before the gate that uses it.
- **#6, #7, #8, #9 are fully independent** of each other and of Group A. Any of them can
  be one PR, in any order, in parallel. Per the working rules: one step = one PR.
- **#10 and #11 are host actions with no code dependency.** Do them while #2 runs —
  ideally in the same SSH session, since #11 requires a container restart anyway.
- **#12 requires everything else merged to `develop`** and deployed to stage.

### What can be parallelized

Two tracks that never touch each other:
- **Ops track:** 1 → 2 → 3, with 10 and 11 folded in. One person, ~half a day of
  wall-clock plus waiting.
- **Code track:** 5 → 4, and 6 / 7 / 8 / 9 as independent PRs into `develop`. Each lands
  on stage on merge via the existing pipeline.

They converge at #12.

### Release-day runbook (high level)

1. **Freeze `develop`.** No merges after the e2e gate.
2. **Green e2e against stage** (#12, `--workers=1`). Red = stop.
3. **Fresh prod backup** (#1 again — the one from the rehearsal is stale by now). Verify
   the dump is non-empty and note row counts.
4. **Announce the window.** No users yet, but the owner is loading data — data entry
   must stop for the duration.
5. **Merge `develop` → `main`.** This fires *two* independent deploys: the GitHub Action
   for the backend, and Vercel for the frontend. They are **not** ordered relative to
   each other — expect a short window where one is new and the other is old, and watch
   for it.
6. **Backend deploy runs in the new order** (#4): migrations first, then serve. Watch the
   Action log; the migration step now fails the deploy instead of being ignored.
7. **Smoke by hand:** `GET /api/health` (must now report DB reachable), Google sign-in
   end to end, one property page, one building page (confirms photo presigning against
   prod's real bucket), the admin panel (confirms #7).
8. **Watch Sentry** — backend *and*, now, frontend (#6) — for 30 minutes.
9. **If it goes wrong:** #3. Do not improvise.

---

## 3. Explicitly OUT of the minimal set

Deferred on purpose. Each line is why it is safe to defer.

| Item | Why it can wait |
|---|---|
| **Wire e2e + lint into CI** | The suite is being run manually as a release gate (#12), which is the part that protects the launch. Automating it protects *future* launches. Also needs the `workers: 1` / throttler fix first. Lint is 0 errors / 358 warnings — turning it on would gate on warnings nobody has triaged. |
| **Full server-side onboarding persistence (plan step 6.8)** | The minimal fix in #8 removes the **lockout**, which is the harmful part. What remains is losing wizard *position* when switching device — annoying, recoverable by the user, and it degrades nothing permanently. |
| **Per-card 404 for tenants with no preferences** (`matching.service.ts:145`) | Only the detail-page per-card route still behaves this way; the batch route that drives every grid already returns `200 {"scores":{}}` (6.2 sub-PR C). Worst case is a missing badge on one page. Changing the answer is a contract change and a product question, not a launch gate. |
| **Fabricated match score on the public landing page** (`frontend/src/app/page.tsx:52–58` — a hash of the property id yielding 75–99%, plus three canned "match reasons", shown to logged-out visitors) | **Product call, and worth making before launch** — a fabricated personalization number on the marketing page is a trust issue. But it breaks nothing and hiding the badge for logged-out visitors is a 15-minute change that can land any time. Flagged here rather than on the bar because it needs the owner's decision, not engineering. |
| **CORS localhost entries** (`cors.config.ts:5–11`) | Not exploitable: `sameSite: "lax"` means no cookie is sent cross-site (see §0). Cosmetic until someone adds a `Bearer`-token client. |
| **Redis-backed throttler (7.1), caching (7.2), queues (7.3), `/metrics` (7.4), pagination audit (7.5)** | All degrade only at scale. In-process throttle counters are correct on a single instance, which is what production is. |
| **Unifying `properties.photos` (`text[]`) with `buildings.photos` (`jsonb`)** | Both read back as `string[]`. Nothing is broken; it is a shape to remember. Rewriting a populated column for tidiness is exactly the wrong trade before launch. |
| **`Shortlist` entity vs `tenant_profiles.shortlisted_properties` duplication** | Needs a data-model decision. The live path works; only one of the two storages is actually read. |
| **Duplicate `GET /properties/public` and `/properties/public/all` routes** | Identical handlers. Harmless; the frontend calls both. Removing one requires touching the caller. |
| **Moving entity files into owner modules (6.7's literal wording)** | 71 files of import churn, zero behaviour change, fixes none of the 8 madge cycles. Deliberately deferred with the owner's agreement. Pure risk before a launch. |
| **Frontend FSD leftovers (`src/features/`, `src/widgets/`)** | Dead architecture, live code paths. Cosmetic. |
| **Ghost migration row on stage** (`AddRefreshTokenHashToUser1775100000000`) | Stage only, `pending = 0`, prod is clean. |
| **Backend `@sentry/nestjs` v10 ships its own `SentryGlobalFilter`** | Ours works. Replacing a working filter days before launch buys nothing. |
| **Translating `docs/audit/` to English** | Owner's standing decision: incremental, «as we go». |

---

## 4. Can this be done in ~2 weeks?

**Yes — comfortably, and the constraint is not engineering time.**

The bar is **~14–24 hours of focused work** across two tracks that do not block each
other. Against 1–2 weeks that is not tight.

What actually consumes the calendar:

- **The rehearsal (#2) is the long pole**, and most of it is waiting rather than working
  — dump, restore, run, read. Budget a full day of wall-clock even though it is 2–4h of
  attention. **Start it first.**
- **#8 (onboarding) is the one item that can grow.** The minimal version — change what
  the redirect gates on — is a few hours. If the product answer to "what counts as
  onboarded" turns into a redesign of the wizard, it is no longer a launch item and the
  minimal version should ship instead. Get that answer early.
- **Two product decisions gate code:** the onboarding completion definition (#8), and
  the landing-page match score (§3). Neither is hard; both need the owner, so ask now.
- **The real risk is not the list — it is the 193-commit release itself.** Nothing in
  this plan makes that release small. What it does is make it *reversible* (#1–#3),
  *ordered* (#4–#5), and *observable* (#5–#6, #9). That is the honest ceiling of what
  can be bought in two weeks, and it is enough to open the doors.

One thing worth stating plainly: **this plan assumes the rehearsal in #2 comes back
clean.** If it does not — if a migration fails against prod's actual schema — that
becomes the whole two weeks, and the launch date moves. That is the correct outcome, and
it is precisely why #2 goes first rather than last.
