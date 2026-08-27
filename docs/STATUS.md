# STATUS — the live project doc

One screen: what is true now, what is open, what needs a human on a host.
This file replaced `PROGRESS.md` (owner decision 2026-08-21): the phase-based
refactoring campaign it tracked is finished, and its full decision log is
preserved at `docs/archive/PROGRESS-refactoring-2026-07-08.md`. New work is
tracked by PRs; anything that must outlive a PR (follow-ups, host actions,
decisions) is recorded HERE, briefly, with a date.

## Where things stand (2026-08-25)

- Refactoring phases 0–6 are closed; Phase 7 (scale) never formally started.
  History: the archived PROGRESS file.
- External review batches 1–5 merged as #139–#143: security hardening, CI
  gates, matching performance, SEO, EmailJS → SES, OpenAPI codegen pipeline,
  booking lifecycle, shortlist on its table, CV contact masking.
- Review round 3 (2026-08-25, deep pass) produced a package roadmap A–F (see
  «Review roadmap» below). Package A — silent data-integrity bugs — is the
  current PR: null-vs-undefined clears, atomic refresh rotation,
  compare-and-swap booking transitions, transactions on multi-step writes,
  `users.google_id` index restored, `preferences.user_id` UNIQUE (with
  dedupe), building deletion detaches units instead of cascading into
  booking history, upload errors as 4xx, `ParseUUIDPipe` on uuid params.
  All three migrations rehearsed against a live local Postgres.
- CI gates every deploy: typecheck, lint (0 errors; warnings are backlog),
  unit tests, build, generated-API-types freshness, e2e smoke (5 specs
  against a real stack). Fresh checkouts bootstrap with `scripts/setup.sh`
  (Claude Code web sessions run it via the SessionStart hook).

## Review roadmap (agreed 2026-08-25, work top to bottom)

- **B — the matching engine tells the truth**:
  - ~~property lifecycle status filtered in every read path and driven from
    the booking pipeline~~ — **done (B1, current PR)**:
    `draft/listed/under_offer/let/archived`, public catalogue/landing/
    matching serve `listed` only, the detail endpoint still resolves
    `under_offer`/`let` (shared links badge instead of 404), the booking
    pipeline drives `listed → under_offer → let` and reverts on cancel.
    Frontend follow-ups: badge `under_offer`/`let` on the detail page,
    status control in the admin property form (API accepts `status` already).
  - ~~location wired in~~ — **done (B2, current PR)**: postcode/lat/lng/
    borough geocoded via postcodes.io on property and building-address
    writes (failure-tolerant — a lookup outage never blocks a save);
    location scorer enabled as category 18 (weight 15; only tenants with a
    location preference are affected); search matches address, postcode and
    borough. Follow-up: backfill geocoding for pre-existing rows (they stay
    null until their address is next edited) — a one-off script over
    properties with an address and no postcode.
  - ~~one governed vocabulary for categorical fields~~ — **done (B3,
    current PR)**: canonical sets in `common/constants/vocabulary.ts`,
    DTOs normalize known aliases and reject the rest (property and
    preferences sides), stored data normalized by migration (rehearsed on
    dirty seeds). The geocoding backfill script also ships here
    (`npm run geo:backfill` in backend/ — host action #5 below).
  - ~~single unknown-data policy~~ — **done (B4, current PR — closes
    package B)**: missing property-side data scores a fixed 30% partial
    with `match: false` in every scorer (`scoring/unknown-data.ts`) —
    blank listings no longer outrank honest ones; the
    `family_status`/`occupation` targeting columns are read as the
    authoritative signal (tenant-type heuristics remain the fallback);
    the smoking scorer no longer invents `propertySmoking = false`.
- **C — the funnel stops being silent**: transactional emails to tenant and
  operator on booking events (outbox already built — new templates plus
  recipients); `proposed_viewing_at` + confirmation on the viewing step;
  KYC/referencing badges become admin-set only; `epc_rating` field (legally
  required on listings) and a Tenant Fees Act deposit-cap warning.
- **D — operator dashboard**: own listings, booking requests on own
  properties (scope the existing admin view by `operator_id`), rights over
  early statuses, email on a new request.
- **E — frontend unwinding**: server-fetched data passed into detail clients
  and public pages ungated from session init; server-side
  `onboarding_completed` in `/auth/me` (kills the three competing sources of
  truth and the redirect races incl. `navigationGuard.ts`); one session
  guard in segment layouts instead of ten inline copies; dissolve
  `useTenantDashboard` into RTK Query hooks (it leaks every cache
  subscription it opens).
- **F — operations (fold into other PRs as touched)**: DB pool size +
  `statement_timeout`; container `mem_limit`; Joi env validation
  (`FRONTEND_URL` unset currently redirects prod OAuth to localhost);
  per-route throttle + sane file-count limit on uploads (100+ × 50 MB
  buffers in RAM today), or presigned-PUT uploads.

## Host actions (blocking, in order)

1. **Install and rehearse the DB backup** — run the «Install DB backup»
   workflow to completion, do the two superuser prerequisites in
   `docs/ops/BACKUP_RUNBOOK.md`, restore into a scratch database once.
   Until then a push to `main` fails its deploy on the backup gate (by
   design), and the migrate-before-serve deploy reorder stays blocked.
2. **Vercel:** set `NEXT_PUBLIC_SITE_ENV=production` in the Production scope
   (indexability switch — without it the prod site stays `noindex` unless
   the legacy `NEXT_PUBLIC_VERCEL_ENV` happens to be exposed).
3. **EmailJS:** delete the keys in the EmailJS dashboard and any `EMAILJS_*`
   Vercel vars — nothing reads them since #142.
4. **Host `.env` files:** remove the stale `CORS_ORIGIN=http://localhost:3000`
   value — the env union still honours it, which re-adds localhost to the
   production CORS allowlist.
5. **Geocoding backfill** (after the B2/B3 migrations are deployed): run
   `npm run geo:backfill` once in `backend/` on each host (stage, then
   prod) with the real `.env`. Idempotent and resumable; rows whose address
   has no full UK postcode are reported and skipped.

## Open follow-ups (recorded, not scheduled)

- **`/app/auth` pushes the post-login redirect instead of replacing it**
  (added 2026-08-27, out of scope of the back-navigation PR). The
  already-authenticated guard at `frontend/src/app/app/auth/page.tsx:29` does
  `router.push("/app/units")`, so the sign-in screen stays in the history
  behind the listing and the browser's own back button walks straight into it
  — where the same guard fires again. It should `replace`. Left alone because
  changing it touches the authenticated-redirect path, not the back
  affordance, and deserves its own verification pass.
- **Admin panel keeps `activeSection` in component state, not the URL**
  (added 2026-08-27, out of scope of the back-navigation PR). Switching admin
  sections pushes no history entry and the section is not addressable, so
  back from an admin section leaves the panel entirely and a reload or a
  shared link always lands on the default section. The fix is to drive
  `activeSection` from a search param — a state-management change to the
  admin shell, not a navigation one.
- **No indexes behind the admin properties search/filters** (added
  2026-08-27). `GET /properties` now filters server-side on
  `title`/`descriptions` (ILIKE), `property_type`, `bathrooms` and
  `is_landing_listing`; only `bedrooms`, `building_id` and `created_at` are
  indexed today. At the current row count a sequential scan is fine. When it
  stops being fine the fix is a trigram index (`pg_trgm`) for the text search
  plus btree indexes on the filter columns — which needs `CREATE INDEX
  CONCURRENTLY` outside a transaction, so it is a deliberate migration with
  its own PR, not a drive-by.
- **Landing listings copy is not in Localazy yet** (added 2026-08-27). The
  section renders English fallbacks via `translateWithFallback` for six keys
  — `landing.{operators,tenant}.web.listings.{title,subtitle,seeAll}`. Add
  them in Localazy and re-sync; no code change needed once they land.
- **Listing disclaimer copy is not in Localazy yet** (added 2026-08-27). The
  property detail page renders the English fallback via `translateWithFallback`
  for `listing.disclaimer.operator.content`. Add the key and its six
  translations in Localazy and re-sync; no code change needed once they land.
- **"Book a call" copy is not in Localazy yet** (added 2026-08-27). The modal
  and the header pill render English fallbacks via `translateWithFallback`.
  Add these keys in Localazy and re-sync; no code change needed once they land.
  Chrome and shared options (`frontend/src/app/lib/translationsKeys/generalKeys.ts`,
  under `bookACall`):
  `landing.common.web.bookacall.` +
  `header.btn` · `title` · `subtitle` ·
  `reason.title` · `reason.placeholder` ·
  `name.title` · `name.placeholder` ·
  `email.title` · `email.placeholder` ·
  `phone.title` · `phone.placeholder` ·
  `time.title` · `time.placeholder` ·
  `time.morning` · `time.afternoon` · `time.evening` · `time.asap` ·
  `notes.title` · `notes.placeholder` ·
  `submit.btn` · `submit.pending` · `success` · `error` ·
  `validation.required` · `validation.email` · `validation.phone`.
  Tenant reason options (`tenantTranslationKeys.ts`, under `bookACall.reason`):
  `landing.tenant.web.bookacall.reason.` +
  `help_find_home` · `finish_rental_cv` · `question_about_property` ·
  `something_else`.
  Operator reason options (`operatorTranslationKeys.ts`, under `bookACall.reason`):
  `landing.operators.web.bookacall.reason.` +
  `units_to_fill` · `see_demo` · `pricing_and_terms` · `landlord_to_let` ·
  `agent_partner` · `connect_feed` · `looking_for_home` · `something_else`.
  The **slug** (the object key) is what the backend stores — the label is
  display-only and must never be sent.
- **`frontend/src/types/generated/api.d.ts` is stale after the demo-request
  removal** (added 2026-08-27). It still carries `/api/demo-requests` and
  `CreateDemoRequestDto`, and does not yet carry `/api/call-requests`. Nothing
  imports either — `frontend/src/app/lib/callRequest.ts` hand-writes its
  request type with a comment saying so. Re-run `npm run gen:api` (it needs the
  backend's `openapi:dump`, which hangs in some sandboxes) and swap the local
  type for `components["schemas"]["CreateCallRequestDto"]`.
- **Call requests have no admin pagination** (added 2026-08-27).
  `GET /call-requests` returns the whole table, mirroring `GET /booking-requests`,
  which does the same. Both want the paginated shape the properties listing
  already uses; doing it for one and not the other would split the convention,
  so it is one follow-up covering both.
- **Migration chain does not replay from an empty database** (noted
  2026-08-18) and carries a duplicate timestamp `1767000000000` (two files).
  Repairing either means renumbering applied migrations plus a host-side
  `UPDATE` of the `migrations` table — one deliberate operation, not a
  drive-by. Until then fresh environments use `TYPEORM_SYNCHRONIZE=true`.
- **Drop `tenant_profiles.shortlisted_properties`** (frozen jsonb column)
  once the `shortlist` table is verified in production; also stop
  initialising it to `[]` on profile creation.
- **Role transitions destroy Preferences** (`user-role.service.ts`
  hard-deletes on tenant→admin and back) and there are two live role-change
  paths with different semantics plus one dead one — consolidate on
  `UserRoleService`, make transitions non-destructive, add specs.
- **OpenAPI adoption**: annotate response shapes with `@ApiResponse({type})`
  so response typing becomes possible, then migrate hand-written `app/types`
  one domain at a time (generated types currently have one consumer).
- **i18n bundle**: all 12 locales (~440 KB chunk) ship statically on every
  route — convert `I18nContext` to per-locale dynamic `import()`. Largest
  measurable user-facing perf win available.
- **No `middleware.ts`**: route protection is client-side only; the admin
  panel shell is statically served to anyone. Add cookie-checking middleware
  for `/app/admin/*`, `/app/profile/*`.
- **`unoptimized: true` images** (presigned URLs defeat the optimizer) — fix
  is stable media URLs, then re-enable optimization.
- **FSD remnants** (`entities/features/shared/widgets`, 39 files vs 179 in
  `app/`) — fold back or finish; owner decision pending.
- **Test depth**: backend 10 spec files / 180 source (≈24% statements), zero
  controller specs; frontend component tests absent (vitest is node-env).
  Priority spec targets: `user-role.service`, `property.service`,
  `shortlist.service`.
- **Lint backlog**: backend 40 warnings, frontend ~460 (incl. `no-console`
  and 25 `set-state-in-effect`); `react-hooks/rules-of-hooks` is still
  `warn` because of one violation in `admin/panel/page.tsx:624` — fix it and
  promote the rule to error.
- **Single-session auth model**: one `refresh_token_hash` per user — second
  device silently logs out the first. Wants a sessions table. (Rotation is
  atomic since package A, so the same-device two-tab race no longer corrupts
  the stored hash — the loser gets a clean 401.)
- **Building→property inheritance has no owner** (round-3 finding): create
  copies nine fields, update propagates four, and matching scores the
  property-side copies — a building edit half-propagates. Wants one
  `propagateInheritedFields` owned by the property module, or reading
  through the relation.
- **Terraform under `infrastructure/`** does not describe the real host —
  either adopt it properly or archive it.
- **Rollback runbook** does not exist (LAUNCH_PLAN item 3); the sketched
  "redeploy previous image" path needs an image registry.
- **Demo-request abuse ceiling**: per-IP throttle + per-email/day dedupe
  only; add a global daily cap or CAPTCHA before the landing gets traffic.

## How to work here

See `CLAUDE.md` for the full rules. Short version: branch from `develop`,
one PR per coherent change, update this file when a PR leaves behind a
follow-up, a decision, or a host action.
