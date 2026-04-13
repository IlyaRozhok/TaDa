# Frontend Refactoring Design

**Date:** 2026-04-11  
**Status:** Approved  
**Scope:** Frontend only (`frontend/src/`)  
**Goal:** Clean, simple, maintainable Next.js-native architecture with a single API layer, no dead code, and better runtime performance.

---

## Context

The MVP is functional. The frontend was built incrementally, resulting in:
- A half-completed FSD migration layered on top of the Next.js App Router
- Two competing API layers (raw axios `api.ts` and RTK Query `apiSlice.ts`)
- TypeScript types duplicated across three locations
- Several god-files exceeding 2000–3000 lines
- Every page using `"use client"`, forfeiting all Server Component benefits
- Unused public assets (38MB), a heavy dependency used in only 2 files, and leftover dead code

**Decision:** Abandon FSD. Use Next.js App Router as the structural backbone. Colocate route-specific code near routes. Shared code lives in flat, purpose-named top-level folders.

---

## Target Folder Structure

```
src/
  app/                        ← Next.js App Router (routes, layouts, providers)
    app/
      properties/
        [id]/
          _components/        ← components used only by this route
          page.tsx            ← thin shell, Server Component where possible
      buildings/
      matches/
      shortlist/
      profile/
      preferences/
      admin/
      auth/
      dashboard/
      tenant-cv/
    layout.tsx
    page.tsx                  ← landing page

  components/                 ← shared components used across multiple routes
    ui/                       ← primitive design system: Button, Input, Card,
    │                            Modal, Badge, Spinner, FormField, Textarea,
    │                            DateInput, PhoneMaskInput, CountryDropdown...
    layout/                   ← Header, Footer, UniversalHeader, Logo
    property/                 ← PropertyCard, PropertyImage, PropertyBadges,
    │                            PropertyCardSkeleton, ImageGallery...
    admin/                    ← AdminPanel section components

  hooks/                      ← shared hooks used across multiple routes
  │   useAuth.ts
  │   useShortlist.ts
  │   useProperties.ts
  │   useDebounce.ts
  │   useTranslation.ts
  │   ...

  lib/
    api.ts                    ← RTK Query createApi (single source of truth)
    utils.ts                  ← shared utility functions

  types/                      ← all TypeScript types, one location
    user.ts
    property.ts
    building.ts
    preferences.ts
    booking.ts
    api.ts
    common.ts
    index.ts

  constants/                  ← all app-wide constants
    mappings.ts
    preferences.ts
    lifestyleFeatures.ts

  store/                      ← Redux store config + slices
    store.ts
    hooks.ts
    slices/
      authSlice.ts
      shortlistSlice.ts
      preferencesSlice.ts
      operatorSlice.ts
      usersSlice.ts
```

### What gets absorbed from the old structure

| Old location | Destination |
|---|---|
| `shared/ui/` | `components/ui/` |
| `shared/constants/` | `constants/` |
| `shared/types/` | `types/` |
| `shared/hooks/` | `hooks/` |
| `app/types/` + `src/types/` | `types/` (merged, deduplicated) |
| `app/constants/` | `constants/` |
| `app/hooks/` | `hooks/` |
| `app/store/` | `store/` |
| `entities/property/ui/` | `components/property/` |
| `entities/preferences/model/` | `types/preferences.ts` + `constants/` |
| `entities/user/` | `types/user.ts` + `hooks/` |
| `features/preferences/` | `app/app/preferences/_components/` + `hooks/` |
| `features/shortlist/` | `hooks/useShortlist.ts` + route colocation |
| `features/profile/` | `app/app/profile/_components/` |
| `widgets/property/` | `components/property/` |
| `widgets/admin/` | `components/admin/` |

FSD folders (`features/`, `entities/`, `widgets/`, `shared/`) are deleted once content is absorbed.

---

## Phase 1: Purge

Remove everything that is confirmed dead or redundant. No logic changes.

### Dead source files
- `src/app/store/slices/operatorSlice.simplified.ts` — leftover, superseded by `operatorSlice.ts`
- `src/app/contexts/AuthContext.tsx` — empty placeholder, auth lives in Redux
- `src/app/auth/` — old auth directory, superseded by `src/app/app/auth/`
- `src/features/README.md`, `src/entities/README.md`, `src/widgets/README.md`
- `src/features/profile/update-profile/ui/INTEGRATION_NOTES.md`

### Public assets
Audit all 95 files in `public/` (38MB total) against actual `<Image src=` and `url(` usages in source code. Confirmed removals:
- Dev/personal photos: `dima.png`, `dima.jpg`, `artur.jpeg`, `ilya.avif`, `uncle.png`, `uncle.svg`, `octopus.png`
- Icon duplicates: `verify-tenant-icon.png` (keep `.svg`), `64.png`, `128.png`
- Any file with zero references in source

### PrimeReact removal
PrimeReact is used in exactly 2 files, only for `InputMask`. `react-imask` is already in `package.json`. Replace `PrimeReact InputMask` with `react-imask` in those 2 files, then remove `primereact` and `primeicons` from `package.json`.

### Backend leftover files (cleanup while in scope)
- `backend/src/modules/properties/properties.service.old.txt`
- `backend/src/modules/properties/properties.controller.old.txt`
- `backend/src/modules/properties/properties.service.refactored.old.txt`

---

## Phase 2: Consolidate

Establish the target folder structure. Move files, fix imports, remove duplicates. No logic changes.

### Step-by-step

1. **Create target folders:** `components/ui/`, `components/layout/`, `components/property/`, `components/admin/`, `hooks/`, `lib/`, `types/`, `constants/`, `store/`

2. **Consolidate types:**
   - Merge `src/types/` + `src/app/types/` + `src/shared/types/` + `src/entities/*/model/` into `src/types/`
   - Identify and remove exact duplicates
   - Export everything from `src/types/index.ts`

3. **Consolidate constants:**
   - Merge `src/app/constants/` + `src/shared/constants/` → `src/constants/`

4. **Consolidate UI components:**
   - `src/shared/ui/` → `src/components/ui/`
   - Resolve duplicate `PhoneMaskInput` (exists in both `shared/ui/` and `components/ui/`) — keep one

5. **Move store:**
   - `src/app/store/` → `src/store/`

6. **Move shared hooks:**
   - `src/shared/hooks/` + `src/app/hooks/` → `src/hooks/`

7. **Move layout components:**
   - `Header.tsx`, `Footer.tsx`, `Logo.tsx`, `UniversalHeader.tsx`, `TenantUniversalHeader.tsx` → `src/components/layout/`

8. **Move property components:**
   - `entities/property/ui/` + property-specific components from `app/components/` → `src/components/property/`

9. **Move admin components:**
   - `AdminBuildingsSection.tsx`, `AdminPropertiesSection.tsx`, `AdminRequestsSection.tsx`, `AdminUsersSection.tsx` + `widgets/admin/` → `src/components/admin/`

10. **Colocate route-specific components:**
    - Components used by only one route move to `app/app/[route]/_components/`

11. **Delete FSD folders** once all content has been moved and all imports updated.

12. **Update `tsconfig.json` path aliases** to reflect new structure.

### Import update strategy
Run a find-and-replace pass per moved module. Update all imports, verify TypeScript compilation passes (`npm run type-check`) before moving to the next phase.

---

## Phase 3: API Migration (RTK Query)

**Goal:** Delete `src/app/lib/api.ts`. RTK Query is the single API layer.

### Target API structure

One `createApi` call in `src/lib/api.ts`, organized by domain using tag-based cache invalidation:

```ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: 'include',
  }),
  tagTypes: [
    'User', 'Property', 'Building', 'Preferences',
    'Shortlist', 'BookingRequest', 'TenantCV', 'Matching'
  ],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation(...),
    register: builder.mutation(...),
    googleAuth: builder.mutation(...),

    // Users
    getProfile: builder.query({ providesTags: ['User'] }),
    updateProfile: builder.mutation({ invalidatesTags: ['User'] }),
    ...

    // Properties
    getProperties: builder.query({ providesTags: ['Property'] }),
    getProperty: builder.query({ providesTags: ['Property'] }),
    createProperty: builder.mutation({ invalidatesTags: ['Property'] }),
    updateProperty: builder.mutation({ invalidatesTags: ['Property'] }),
    deleteProperty: builder.mutation({ invalidatesTags: ['Property'] }),

    // Matching
    getMatches: builder.query({ providesTags: ['Matching'] }),

    // Shortlist
    getShortlist: builder.query({ providesTags: ['Shortlist'] }),
    addToShortlist: builder.mutation({ invalidatesTags: ['Shortlist'] }),
    removeFromShortlist: builder.mutation({ invalidatesTags: ['Shortlist'] }),

    // ... all other endpoints
  })
})
```

### Migration rules

- Every `useEffect` + axios call → replaced with `useQuery` hook from RTK Query
- Every `useCallback` wrapping an axios call → replaced with `useMutation` hook
- Local `isLoading` / `error` state removed where RTK Query provides them
- 401 interceptor logic → handled via RTK Query's `baseQuery` wrapper with `re-auth` middleware

### Tag invalidation rules

| Mutation | Invalidates |
|---|---|
| `updateProfile` | `User` |
| `createProperty`, `updateProperty`, `deleteProperty` | `Property`, `Matching` |
| `updatePreferences` | `Preferences`, `Matching` |
| `addToShortlist`, `removeFromShortlist` | `Shortlist` |
| `updateBookingStatus` | `BookingRequest` |

### Completion criteria
- `src/app/lib/api.ts` deleted
- No `import axios` anywhere in `src/` outside of `lib/`
- `npm run type-check` passes

---

## Phase 4: Component Restructure + Performance

### Break the god-file modals

**Pattern** (already exists in `AddPropertyModal/components/`): Modal orchestrates, sections own their logic.

Apply to:
- `EditPropertyModal.tsx` (3034 lines) → `app/app/properties/[id]/_components/edit/` with `BasicInfoSection`, `LocationSection`, `AmenitiesSection`, `MediaSection`, `DetailsSection`
- `EditBuildingModal.tsx` (2431 lines) → `app/app/buildings/[id]/_components/edit/` with equivalent sections
- `AddBuildingModal.tsx` (2170 lines) → `app/app/buildings/_components/add/` with equivalent sections

Each section: one clear purpose, receives form context via props or `useFormContext`, independently readable.

### Server Components audit

**Rule:** `"use client"` goes only on the smallest component that needs interactivity — not the whole page.

Currently every page has `"use client"` at the top. Pages to convert to Server Components (fetch data server-side, render HTML, send minimal JS):
- `app/app/properties/[id]/page.tsx` — property detail is mostly static content. Only the booking button, gallery, and map need to be client islands.
- `app/app/buildings/[id]/page.tsx` — same pattern
- `app/app/operators/[id]/page.tsx` — public profile, mostly static
- `app/privacy/page.tsx`, `app/terms/page.tsx` — pure static, zero interactivity
- Landing page sections that don't have interactive state

**Pattern for converted pages:**
```tsx
// page.tsx — Server Component
export default async function PropertyPage({ params }) {
  const property = await fetchProperty(params.id) // direct fetch, no useEffect
  return (
    <>
      <PropertyDetails property={property} />   {/* Server Component */}
      <BookingPanel propertyId={params.id} />   {/* "use client" */}
      <PropertyMap coords={property.coords} />  {/* "use client" */}
    </>
  )
}
```

### Image optimization

Replace raw `<img>` tags with Next.js `<Image>` in:
- `src/app/privacy/page.tsx`
- `src/app/app/properties/[id]/page.tsx`
- `src/app/components/AuthModal.tsx`
- `src/entities/property/ui/PropertyContent.tsx`

Benefits: automatic lazy loading, WebP conversion, responsive `srcset`, no layout shift.

---

## Non-goals

- No backend changes in this refactoring (separate initiative)
- No new features
- No test suite (separate initiative)
- No design system changes — `components/ui/` absorbs what exists, no new components invented

---

## Success Criteria

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run build` succeeds
- [ ] No imports from deleted paths
- [ ] `src/app/lib/api.ts` deleted
- [ ] FSD folders (`features/`, `entities/`, `widgets/`, `shared/`) deleted
- [ ] `primereact` removed from `package.json`
- [ ] No god-files over ~400 lines (excluding generated code)
- [ ] At least the static/public-facing pages are Server Components
- [ ] All `<img>` tags replaced with `<Image>`
