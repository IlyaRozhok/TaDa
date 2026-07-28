# TaDa — Refactoring Roadmap

> Read this first (per `CLAUDE.md`). It is the source of truth for the
> feature-by-feature refactor: what each scope changes, in what order, how it is
> proven safe, and its current status. Every scope is its own branch off
> `develop` → PR into `develop`. AI never merges or approves PRs.

## Principles (per-scope loop)

1. **Characterization tests first** — pin current observable behaviour before
   touching it. The repo started at **zero tests**; a Jest harness now exists
   (added in the Users/Profiles scope).
2. **Consolidate** duplicates onto a single source of truth.
3. **Relocate** code to the correct layer/module.
4. **Simplify** — remove redundant state, fallbacks, dead branches.
5. **Delete dead code LAST**, only after `grep`-confirming no remaining
   imports/links.

Green `npm run build` + green tests on **every** commit. Migrations are
`mig:gen`-generated against a real DB (never hand-written) — the one exception
is pure **data** migrations (backfills), which the generator cannot express.

## Invariants — do not touch

- TypeORM `synchronize` stays `false` everywhere.
- Auth tokens live only in httpOnly cookies; identity is read from `/auth/me`.
- S3 failures must not crash unrelated flows.
- Remote DB uses `rejectUnauthorized: true`.
- `*.tfstate*` is never committed.
- No debug/diagnostic endpoints in committed code.

---

## Status board

| # | Scope | Branch | Status |
|---|-------|--------|--------|
| 1 | Auth (Google + JWT only) | `claude/project-review-summary-y9d6p9` | ⏳ ready to merge — needs `refresh_token_hash` migration + merge to develop |
| 2 | User profile (dead-code removal) | `claude/user-profile-refactor` | ✅ done (PR open) |
| 3 | Users/Profiles schema consolidation | `refactor/users-profiles-schema` | 🟡 2a+2b+2c.1 done; column drop gated on #1 |
| 4 | Property/Properties module de-dup | `refactor/property-module-dedup` | ✅ done (pushed) |
| 5 | Matching cache → Redis | — | ⬜ not started |
| 6 | Booking / Shortlist module canon | — | ⬜ not started |
| 7 | Backend prod-ready sweep | — | ⬜ not started |
| 8 | Frontend: domains migration | — | ⬜ not started |

---

## Scope 1 — Auth (Google + JWT only)

**Target:** single auth path (Google OAuth → stateless JWT in httpOnly cookies).
No password login, no Redis sessions, no debug endpoints.

**Done:** async JWT signing (`signAsync` + `Promise.all`); refresh-token rotation
with a SHA-256 hash stored in `users.refresh_token_hash` (revocable); 401
interceptor fixed so `/auth/me` refreshes instead of logging out; access TTL
restored to **15m**, refresh **7d**.

**Blockers before merge to develop:**
- `refresh_token_hash` column has an entity field but **no migration** →
  `npm run mig:gen -- src/database/migrations/AddRefreshTokenHashToUsers`,
  then `mig:run`.
- Likely merge conflict with develop's admin pagination in
  `admin/panel/page.tsx` + `AdminUsersSection.tsx` — resolve in favour of
  develop's version.

## Scope 2 — User profile (dead-code removal) ✅

Deleted unused profile UI/hooks on the frontend, routed the avatar-upload
response through `toUserResponse` (no PII leak), consolidated the profile form.

## Scope 3 — Users/Profiles schema consolidation 🟡

**Problem:** identity/contact fields are duplicated across three tables —
`users`, `tenant_profiles`, `operator_profiles`
(`full_name, first_name, last_name, address, phone, date_of_birth, nationality`).
Writes already target `users`; profiles were kept in sync as a mirror and read
via fallback chains.

**Target:** `users` is the single source of truth for identity; profiles hold
only role-specific data (tenant: occupation/lifestyle/…; operator:
company/vat/business_address/…).

**Done:**
- **2a** — all reads moved to `users` (mapper phone, user/preferences search
  queries, `computed_full_name`, role-service); mirroring removed.
- **2b** — hand-written **data** backfill migration
  (`1775300000000-BackfillUserIdentityFromProfiles`): `users` ← profiles via
  `COALESCE`/`NULLIF`, idempotent, must run **before** the column drop.
- **2c.1** — deleted 6 dead `UserProfileService` methods (only
  `updatePreferences` + `deleteUserData` remain); characterization tests
  refocused on the live surface.

**Remaining (gated on Scope 1 merging into develop):**
- Strip identity placeholders from profile creation in `user-admin.service`,
  `user-role.service`, `shortlist.service`, and (clean) `auth.service`.
- Remove the duplicate columns from `TenantProfile`/`OperatorProfile` entities,
  then `mig:gen ... DropDuplicateProfileIdentityColumns` + `mig:run` (after 2b).

## Scope 4 — Property/Properties module de-dup ✅

`PropertiesModule` was a functional duplicate of `PropertyModule` (same
controller/service/providers). Registered `PropertyModule`, deleted
`modules/properties/` including the dead `create-property.dto.ts` that used the
wrong singular `description` field (the live path uses `descriptions`).

## Scope 5 — Matching cache → Redis ⬜

`MatchingCacheService` uses an in-memory `Map` — lost on restart, wrong across
instances. Migrate to the global `RedisModule` with namespaced keys
(`matching:<userId>:results`) and an explicit TTL. Characterize current
match/recommendation responses first.

## Scope 6 — Booking / Shortlist module canon ⬜

Thin modules; bring to the standard controller/service/mapper/dto shape.
Frontend has a `shortlist` feature slice plus a legacy `store/slices/shortlistSlice`
— consolidate onto one.

## Scope 7 — Backend prod-ready sweep ⬜

Remove `console.log` noise (incl. Cyrillic debug logs in `frontend .../api.ts`
uploads), stray `any`, and any swallowed errors (let Nest exceptions propagate
to `SentryGlobalFilter`). Split any service past ~150 lines into `services/`
sub-services with a delegating facade.

## Scope 8 — Frontend: domains migration ⬜

Mid-migration to domain-driven `domains/`. Ordered work:
- Extract god components: `EditPropertyModal.tsx` (~3034 lines),
  `EditBuildingModal.tsx` (~2431), `AddBuildingModal.tsx` (~2170),
  `properties/[id]/page.tsx` (~1684), `admin/panel/page.tsx` (~1291).
- Migrate `src/app/lib/api.ts` (legacy axios) → RTK Query endpoints per domain.
- De-dup `src/app/types/` → canonical `src/types/`.
- Relocate `src/app/components/` (150+ legacy files) into `domains/<x>/components/`
  or `components/ui/`. Delete each only after grep-confirming no imports.

---

## Suggested order from here

1. Merge Scope 1 (auth) into develop — unblocks Scope 3's column drop.
2. Finish Scope 3 (drop duplicate columns).
3. Scope 4 PR review/merge (independent, ready now).
4. Scope 5 (matching → Redis) — needs Redis to test.
5. Scope 7 backend sweep (cheap, low-risk).
6. Scope 8 frontend, god-component by god-component.
