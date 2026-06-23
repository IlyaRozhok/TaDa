# TaDa Rental Platform — Monorepo Rules

## Context-aware execution
Before generating code or modifications:
1. Read `REFACTORING_ROADMAP.md` in the repo root first.
2. Confirm which stage / feature is the active target — infer it from the roadmap or
   the request; ask only when it is genuinely ambiguous.
3. Handle the whole vertical slice for that domain together — backend, frontend, and
   tests — iteratively, not in isolation.

## Repository layout
```
tada-prod/
├── backend/                 # NestJS API (TypeORM, PostgreSQL, Redis, S3)
├── frontend/                # Next.js 16 App Router (React 19, Redux, RTK Query, Tailwind v4)
├── infrastructure/          # Terraform
├── nginx/
└── REFACTORING_ROADMAP.md   # Refactoring sequence — source of truth for stages
```

## Branches
| Branch    | Environment | Rule                                  |
|-----------|-------------|---------------------------------------|
| `master`  | Production  | Never push directly; PR + review only |
| `develop` | Staging     | Feature branches merge here first     |

- Feature branches: `feature/<name>`, `fix/<name>`, `refactor/<name>` — always cut from `develop`.
- PRs target `develop`. Keep `refactor/`, `fix/`, `feat/` as separate commits.
- If you find a bug while refactoring, log it and fix it separately — never inline.
- Create PRs from a separate feature branch; do not merge or approve them yourself.

## Refactoring order (chosen for safety, not speed)
Each step must keep observable behaviour identical:
1. **Safety net** — characterization tests pinning current behaviour for the area you touch.
2. **Consolidate duplicates** — merge same-thing-in-two-places, verify identical behaviour.
3. **Move to the right layer** — relocate misplaced files to their canonical home.
4. **Simplify logic** — only after 1–3.
5. **Delete dead code LAST** — only after grep-confirming unreachability. TypeScript
   "unused" warnings do not see NestJS DI, TypeORM metadata, Passport decorators, or
   Next.js route conventions.

## Testing posture
The codebase started with zero tests — that is what makes refactoring dangerous, not a
reason to skip them.
- Pin current behaviour with characterization tests **before** changing it; refactor while green.
- Backend: Jest (`.spec.ts`). Frontend: Vitest + React Testing Library (`.test.tsx`).
- Type-checking is necessary but **not sufficient** — it does not catch silent regressions
  in DI-wired or large page components.

## Cross-cutting rules
- No commented-out code — git history preserves it.
- English only in source — no non-English comments or strings.
- No `console.log` in committed code — backend logs via NestJS `Logger`, frontend reports
  via Sentry. Never swallow errors silently.
- No `any` in new TypeScript without an inline `// eslint-disable` and a justification.
- No `TODO`/`FIXME` without a linked issue number.
- Never stage `.env.*`, `*.local`, `*.tfstate*`, or any secret file.

## Invariants — Do Not Touch
These encode past incidents (data loss, credential exposure, silent user-facing failures).
Change only with team discussion and a written rationale in the PR.

- **TypeORM `synchronize`** — hard `false` in every config path. All schema changes go
  through migrations. `synchronize: true` against a migrated DB drops columns silently and
  irreversibly.
- **Auth tokens** — httpOnly cookies only. Never in `localStorage`, `sessionStorage`, URL
  params, or fragments (they leak into logs, history, `Referer`). Google OAuth sets cookies
  then redirects with `?success=true` only.
- **S3 failures** — `uploadFile` must throw on failure; `refreshUrl` / `refreshAvatarUrl` /
  `refreshMediaUrls` must surface the failure, never serve a stale or fake URL.
- **Migrations** — never edit a migration after it has run on a shared env (breaks
  checksums). Fix mistakes with a new corrective migration.
- **DB SSL (remote DB)** — `ssl: { rejectUnauthorized: true, ca: <CA cert> }`. Never ship
  `rejectUnauthorized: false` to a networked DB. A local same-host DB may disable SSL.
- **Terraform state** — `*.tfstate*` never committed (plaintext secrets). If found in
  history, rotate the affected credentials and scrub history, not just `git rm`.

## Definition of Done
The global baseline is not yet lint/type clean, so until it is, checks apply to the files
you changed, and the global error count must never increase (ratchet).

**Backend**
- [ ] `cd backend && npm run build` exits 0
- [ ] `cd backend && npm run lint` — no new errors on changed files
- [ ] New column is `nullable: true` or has a `DEFAULT` in its migration
- [ ] No `synchronize: true`; no `console.log`

**Frontend**
- [ ] `cd frontend && npx tsc --noEmit` — no new errors on changed files
- [ ] `cd frontend && npm run lint` — no new errors on changed files
- [ ] New API call goes through RTK Query; no new axios
- [ ] New type in `src/types/`; no `console.log`

**Both**
- [ ] English-only source; no `TODO`/`FIXME` without an issue; no secret files staged
- [ ] Feature branch off `develop`; PR targets `develop`
- [ ] Behaviour-changing refactor is covered by a test pinning prior behaviour
