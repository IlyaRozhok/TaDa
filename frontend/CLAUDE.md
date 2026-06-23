# Frontend — Next.js Rules

## Stack

- **Framework**: Next.js 16, App Router, React 19
- **Language**: TypeScript 5, strict mode
- **Styling**: Tailwind CSS v4
- **State**: Redux Toolkit + RTK Query
- **Forms**: React Hook Form + Zod
- **HTTP**: RTK Query (canonical) — axios is legacy; add no new axios calls
- **i18n**: Localazy
- **Maps**: Google Maps JS API + `@react-google-maps/api`
- **Monitoring**: Sentry (via root layout)

## Architectural target: Feature-Sliced Design (FSD)

The codebase is migrating toward FSD. Imports flow downward only:

```
app/   →   pages/   →   widgets/   →   features/
                        entities/  →   shared/
```

### Current state vs target

| Location                | Status                   | Action                                    |
|-------------------------|--------------------------|-------------------------------------------|
| `src/app/components/`   | Legacy dump (~100 files) | Migrate to FSD layers progressively       |
| `src/widgets/`          | Partial FSD              | Page-level composed components            |
| `src/features/`         | Partial FSD              | User interactions / mutations             |
| `src/entities/`         | Partial FSD              | Domain models + base UI                   |
| `src/shared/`           | Partial FSD              | Design system, utils, API config          |
| `src/types/`            | Canonical                | All shared types live here                |
| `src/app/types/`        | Legacy duplicate         | Delete after migrating all imports        |
| `src/pages/profile/ui/` | Empty legacy             | Delete                                    |

### Migrating `src/app/components/`
When touching a file there, relocate it:
- Pure display, no data fetching → `src/entities/<domain>/ui/`
- Encapsulates a user action → `src/features/<domain>/`
- Composes features into a page section → `src/widgets/`
- Truly generic (Button, Input, Modal) → `src/shared/ui/`
- One-off page-level wrapper → `src/app/app/<route>/`

Do not create new files in `src/app/components/`.

## Invariants — Do Not Touch

See root `CLAUDE.md` for the cross-cutting list. Frontend-specific:

### Auth tokens
Never store auth tokens in `localStorage`, `sessionStorage`, URL params, or persisted JS
variables. Tokens live in httpOnly cookies set by the backend. `SessionManager` reads identity
from `/auth/me`, never from a stored token.

### RTK Query cache vs Redux
Server state lives in the RTK Query cache **only**. Do not mirror API responses into Redux slices.
Slices hold UI-local client state (`authSlice`, `preferencesSlice`, etc.). Note: `shortlistSlice`
still calls legacy axios (finding I7) — migrating it to RTK Query is the target.

### Component size
No component file over 250 lines. `src/app/app/page.tsx` is currently ~15K lines (finding I5) — a
known tech-debt emergency. Do not add features to it; extract into FSD layers instead.

### Type location
New types always go to `src/types/`, never `src/app/types/` (legacy duplicate with enum-casing
conflicts, e.g. `PropertyType.Apartment` vs `APARTMENT`).

### New HTTP calls
All new API calls go through RTK Query (`src/store/slices/apiSlice.ts`). Do not add endpoints to
`src/app/lib/api.ts` — it is legacy and targeted for deletion.

## File structure inside each FSD slice

```
src/features/shortlist/
├── model/   # Redux slice, selectors, thunks
├── lib/     # Pure helpers specific to this feature
├── ui/      # React components
└── index.ts # Public API — export only what other slices need
```

Never import from inside another slice's internal folders — use only its `index.ts`.

## HTTP / data fetching

RTK Query is the single HTTP client. When migrating an axios call: add the endpoint to
`apiSlice.ts`, add the tag type if needed, then delete the axios method. Components use generated
hooks (`useGetPropertyQuery`, `useCreatePropertyMutation`, …).

## Types

Single source of truth: `src/types/`.

```
src/types/
├── index.ts   # Re-exports everything
├── user.ts · property.ts · building.ts · preferences.ts
├── booking.ts · tenantCv.ts
├── api.ts     # Pagination, error envelope
└── common.ts  # Shared primitives
```

- Don't define a type in a component file if it's used in more than one place
- Import as `import type { X } from "@/types"`

## Component rules

- Client-interactive components start with `"use client"` — nothing else
- Server components (no directive) cannot use hooks, Redux, or browser APIs
- `"use server"` only in Route Handlers (`src/app/api/`) and Server Actions
- One default export per component file; named re-exports via `index.ts`
- No God components (>250 lines) — extract sub-components or hooks

### Naming
| Thing          | Convention            |
|----------------|-----------------------|
| Component file | `PascalCase.tsx`      |
| Hook file      | `useCamelCase.ts`     |
| Utility file   | `camelCase.ts`        |
| Slice file     | `camelCaseSlice.ts`   |
| Page / layout  | `page.tsx` / `layout.tsx` |

## Styling

- Tailwind only; no inline `style={{}}` except for dynamic values Tailwind can't express
- `clsx` + `tailwind-merge` via the `cn()` helper for conditional classes
- No CSS Modules / global CSS beyond `src/app/styles/` and `tailwind.config.ts`
- Design tokens in `src/shared/ui/tokens/`

## Forms

- React Hook Form + Zod resolver
- Schema in the form file, or `lib/validation.ts` if reused
- Never control fields with `useState` — use `register` / `Controller`

## i18n

- Translation keys are typed constants in `src/app/lib/translationsKeys/`
- Never hardcode user-visible strings — use `useTranslation()`
- Run `npm run localazy:sync` after adding/changing keys

## Routing

```
src/app/
├── layout.tsx · page.tsx
├── privacy/ · terms/
├── properties/[id]/   # Public property view
├── cv/[uuid]/         # Public tenant CV share
└── app/               # Authenticated area (auth-guarded layout)
    ├── dashboard/ preferences/ properties/ shortlist/ profile/
    ├── tenant-cv/ matches/ onboarding/
    ├── buildings/[id]/ operators/[id]/ admin/panel/
```

Committed dev pages `src/app/properties/[id]/test-page.tsx` and `.../test/` — delete (confirm no
internal links first).

## Performance

- `React.memo` / `useMemo` / `useCallback` only when profiling shows a problem — don't pre-optimise
- Images via `next/image` with explicit `width`/`height` or `fill` + sized container
- `next/dynamic` `{ ssr: false }` for heavy client-only components (maps, media players)

## Known legacy to eliminate (in order)

> Follow the root refactoring order: safety net + reachability check first, **deletion last**.
> Each deletion below assumes you have grep-confirmed no remaining imports/links.

1. Delete `src/app/types/` (migrate imports → `src/types/`)
2. Delete `src/app/properties/[id]/test-page.tsx` and `.../test/`
3. Delete `src/pages/profile/ui/` (empty)
4. Delete `src/app/components/PropertyGridWithLoader.tsx` (re-export shim; update callers)
5. Migrate each `src/app/components/*.tsx` to its FSD layer when touched
6. Migrate axios calls to RTK Query; delete `src/app/lib/api.ts` when empty
7. Consolidate `src/app/hooks/`, `src/app/components/hooks/`, `src/shared/hooks/` → generic hooks
   in `src/shared/hooks/`, feature-local hooks in their slice

## Definition of Done (frontend)

Until the global baseline is clean, checks apply to changed files; global error count must not increase.

- [ ] `npx tsc --noEmit` — no new errors on changed files
- [ ] `npm run lint` — no new errors on changed files
- [ ] No `console.log`
- [ ] New component: `"use client"` only if it uses hooks/browser APIs
- [ ] New API call added to `apiSlice.ts`; no new axios
- [ ] New type in `src/types/`, imported as `import type { X } from "@/types"`
- [ ] New component placed in its FSD layer (not `src/app/components/`)
- [ ] User-visible string uses `useTranslation()`; key added to `en.json`; `localazy:sync` run
- [ ] No token stored outside httpOnly cookies
- [ ] Behaviour-changing refactor is covered by a test pinning prior behaviour
