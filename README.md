# TaDa

A rental platform. A tenant goes through onboarding, gets matched properties,
shortlists them and sends a viewing request; an administrator manages properties,
buildings and requests.

**Production — [ta-da.co](https://ta-da.co)** (branch `main`)
**Staging — [stage.ta-da.co](https://stage.ta-da.co)** (branch `develop`)

---

## Layout

**This is not a monorepo.** There is no root `package.json` and no workspaces —
two independent applications sit side by side in one repository, each with its
own dependencies:

```
backend/      Nest.js 10 + PostgreSQL + TypeORM 0.3   → Docker on a VPS (Hetzner) behind nginx
frontend/     Next.js 16 (App Router) + React 19 + Redux Toolkit + Tailwind v4 → Vercel
nginx/        prod.conf, stage.conf
docs/audit/   audit results and the refactoring plan — the source of truth
docs/archive/ historical documents, not guidance
```

Authentication is **Google OAuth only**: httpOnly cookies plus a JWT with refresh
token rotation. There is no password login.

---

## Running locally

You need Node 20, Docker (or any Postgres) and `psql` on your `PATH` — the last
one is used by the e2e seeding.

**1. Database.** Postgres on `localhost:5432`. On a FRESH database do **not**
run migrations — the chain does not replay from empty (a known ordering defect,
see `docs/STATUS.md`). Let TypeORM create the schema from the entities instead:

```bash
cd backend
cp .env.example .env      # fill in DB_*, JWT_SECRET, GOOGLE_*
                          # and set NODE_ENV=development, TYPEORM_SYNCHRONIZE=true
npm ci
```

(`npm run mig:run` is only for a database that already carries the migration
history — i.e. a dump of stage/prod.)

**2. Backend** — `http://localhost:5001`, API under the `/api` prefix:

```bash
cd backend && npm run dev
```

**3. Frontend** — `http://localhost:3000`:

```bash
cd frontend
cp .env.example .env.local   # fill in NEXT_PUBLIC_API_URL
npm ci
npm run dev
```

Check the backend is alive: `curl http://localhost:5001/api/health`
Swagger: `http://localhost:5001/api/docs` (basic auth in production).

---

## Checks

CI runs these same commands, so it is worth running them locally before opening
a PR.

| What | Backend | Frontend | In CI |
|---|---|---|---|
| Types | `npx tsc -p tsconfig.json --noEmit` | `npm run type-check` | yes |
| Lint | `npm run lint` | `npm run lint` | yes (errors gate; warnings are backlog) |
| Unit tests | `npm test` (jest) | `npm test` (vitest) | yes |
| Build | `npm run build` | `npm run build` | yes |
| E2E | — | `npm run e2e` (Playwright) | smoke subset (auth, session-refresh, role-escalation, property-browsing) against a seeded stack |

Bootstrap a fresh checkout with `scripts/setup.sh` (installs dependencies for
both apps). Claude Code on the web runs it automatically via the SessionStart
hook in `.claude/`.

### E2E

These need the full local stack running (frontend, backend, database) plus
`psql`. Sessions are prepared without any test-login route on the backend: users
are seeded straight into Postgres and the JWT is signed with the same secret the
application uses.

```bash
cd frontend && npm run e2e
```

Addresses can be overridden with `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_API_URL`.

---

## Workflow

```
develop (staging)  →  main (production)
```

Every task: **branch off `develop` → PR into `develop` → verify on staging →
release to `main`**.

- `develop` is always the base branch. Never commit straight to `main`.
- One step, one PR.
- Everything committed to the repository is written in English — code comments,
  commit messages, PR titles and bodies, and documentation.
- The 20+ old refactoring branches on the remote are **not merged and not
  revisited**.

## Deployment

`.github/workflows/deploy.yml`:

1. **Checks** — three jobs: `backend` (types, lint, tests, build), `frontend`
   (types, tests, lint, generated-API-types freshness, build) and `e2e-smoke`
   (a real stack — Postgres service + backend + `next start` — running the
   smoke subset of the Playwright suite). Both deploy jobs depend on all
   three, so a failure in any blocks the release.
2. **`develop` → staging**, **`main` → production**: SSH to the VPS, `git pull`,
   `docker compose build/up`, then `npm run mig:run:prod`.

Migrations are applied **only by that explicit step**. `migrationsRun` in
`typeorm.config.ts` is deliberately off so that a failing migration shows up in
CI instead of putting the container into a restart loop.

The frontend deploys to Vercel and is not part of this workflow.

---

## Where to look next

**`docs/STATUS.md` is the live document**: current state, open follow-ups and
pending host actions on one screen.

| Where | About |
|---|---|
| `docs/STATUS.md` | The live doc — read this first |
| `docs/audit/00`–`05` | Historical audit snapshots (2026-07-28), each with a staleness banner |
| `docs/audit/LAUNCH_PLAN.md` | The launch bar: backup, deploy order, prod lag |
| `docs/ops/BACKUP_RUNBOOK.md` | DB backup/restore runbook |
| `docs/archive/` | Frozen history, incl. the refactoring PROGRESS log |

`CLAUDE.md` in the root is the entry point for the agent: rules, step boundaries,
code style.

**Ignore `docs/archive/`.** It holds abandoned plans and a README describing an
architecture that does not exist.

## Do not

- Commit directly to `main`.
- Edit `frontend/src/translations/*` — Localazy owns those files and overwrites
  local edits.
