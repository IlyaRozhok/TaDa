# STATUS — the live project doc

One screen: what is true now, what is open, what needs a human on a host.
This file replaced `PROGRESS.md` (owner decision 2026-08-21): the phase-based
refactoring campaign it tracked is finished, and its full decision log is
preserved at `docs/archive/PROGRESS-refactoring-2026-07-08.md`. New work is
tracked by PRs; anything that must outlive a PR (follow-ups, host actions,
decisions) is recorded HERE, briefly, with a date.

## Where things stand (2026-08-21)

- Refactoring phases 0–6 are closed; Phase 7 (scale) never formally started.
  History: the archived PROGRESS file.
- External review batches 1–5 merged as #139, #140, #141, #142 and the current
  PR: security hardening, CI gates (lint both apps + e2e smoke + deploy
  concurrency), matching performance (prefilters + ranking cache + ceiling),
  SEO (metadata, JSON-LD, robots/sitemap, stable OG images), EmailJS → SES,
  OpenAPI codegen pipeline, booking lifecycle, shortlist on its table,
  dead-code sweeps, CV contact masking.
- CI gates every deploy: typecheck, lint (0 errors; warnings are backlog),
  unit tests, build, generated-API-types freshness, e2e smoke (5 specs
  against a real stack). Fresh checkouts bootstrap with `scripts/setup.sh`
  (Claude Code web sessions run it via the SessionStart hook).

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

## Open follow-ups (recorded, not scheduled)

- **Landing listings copy is not in Localazy yet** (added 2026-08-27). The
  section renders English fallbacks via `translateWithFallback` for six keys
  — `landing.{operators,tenant}.web.listings.{title,subtitle,seeAll}`. Add
  them in Localazy and re-sync; no code change needed once they land.
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
  device silently logs out the first. Wants a sessions table.
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
