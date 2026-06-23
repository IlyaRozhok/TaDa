# Frontend — Next.js Rules

## Stack
Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS v4 ·
Redux Toolkit + RTK Query · React Hook Form + Zod · Localazy (i18n) · Sentry.

## Architecture: domain-driven, feature-isolated
Organize by business domain, not by deep generic layers.
```
src/
├── app/             # Next.js routing only (page.tsx, layout.tsx) — keep pages thin
├── components/ui/   # global presentational primitives (Button, Input, Skeleton)
├── shared/          # universal utilities, generic hooks, base API/store config
├── types/           # canonical global types (index.ts re-exports everything)
└── domains/         # business modules: auth, properties, favorites, profile, …
```

Anatomy of a domain (`domains/properties/`):
- `components/` — presentational or interactive UI tied to this domain
- `store/` — RTK Query endpoint injections + local slice logic
- `hooks/` — domain hooks abstracting UI state or async behaviour
- `types.ts` — types local to this domain
- `index.ts` — public API; other domains import only from here, never from internals

### Single home rule
Truly generic primitives (Button, Input, Modal) → `components/ui/`. Domain-specific UI →
that domain's `components/`. Do not place generic UI in two places.

## Migration reality (legacy → domains)
The tree is mid-migration. When you touch a legacy file, relocate it:
- `src/app/components/` (legacy dump, ~100 files) → the matching `domains/<x>/components/`,
  or `components/ui/` if truly generic. **Add no new files here.**
- `src/app/types/` (legacy duplicate) → `src/types/`. Canonical is `src/types/`.
- `src/app/lib/api.ts` (legacy axios) → RTK Query endpoints in the relevant domain `store/`.
  **Add no new axios.**
Each deletion comes LAST, after grep-confirming no remaining imports/links.

## Page & component rules
- `page.tsx` / `layout.tsx` orchestrate only — pull components from `domains/`, with no
  inline fetching or styling.
- Client-interactive components start with `"use client"` and nothing else; server
  components cannot use hooks, Redux, or browser APIs.
- One default export per component; named re-exports via `index.ts`.
- No component over 250 lines — extract sub-components or hooks. (`src/app/app/page.tsx` is
  a known ~15K-line emergency: extract from it, never extend it.)

## Data & types
- RTK Query is the single HTTP client. Migrate an axios call by adding the endpoint (+ tag)
  to the domain `store/`, then deleting the axios method. Components use generated hooks
  (`useGetPropertyQuery`, `useCreatePropertyMutation`, …).
- Server state lives in the RTK Query cache **only** — do not mirror API responses into
  Redux slices. Slices hold UI-local client state.
- New types in `src/types/`, imported as `import type { X } from "@/types"`.

## Styling, forms, i18n
- Tailwind only; conditional classes via the `cn()` helper (clsx + tailwind-merge). No inline
  `style={{}}` except for dynamic values Tailwind can't express.
- React Hook Form + Zod resolver; never control fields with `useState`.
- No hardcoded user-visible strings — use `useTranslation()`; add keys to
  `src/app/lib/translationsKeys/`; run `npm run localazy:sync` after changing keys.

## Performance
- `React.memo` / `useMemo` / `useCallback` only when profiling shows a problem — no
  pre-optimisation.
- Images via `next/image` with explicit `width`/`height` or `fill` + a sized container.
- `next/dynamic { ssr: false }` for heavy client-only components (maps, media players).

## Invariants & Definition of Done
See the root `CLAUDE.md` for the cross-cutting invariants and the frontend Definition of
Done checklist. Frontend-specific invariant: never store auth tokens anywhere but httpOnly
cookies — `SessionManager` reads identity from `/auth/me`, never from a stored token.
