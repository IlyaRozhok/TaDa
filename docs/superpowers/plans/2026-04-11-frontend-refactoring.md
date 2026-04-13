# Frontend Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Next.js frontend from a half-migrated FSD + unstructured hybrid into a clean, Next.js-native architecture with a single RTK Query API layer, no dead code, and Server Components where appropriate.

**Architecture:** Route logic and route-specific components live colocated under `app/app/[route]/`. Shared components live in `src/components/`. One RTK Query `createApi` in `src/lib/api.ts` replaces the raw axios `api.ts`. FSD folders (`features/`, `entities/`, `widgets/`, `shared/`) are absorbed into the new structure and deleted.

**Tech Stack:** Next.js 16 (App Router), React 19, Redux Toolkit + RTK Query, TypeScript, TailwindCSS 4, react-hook-form, zod, react-imask

---

## Reference: Target Folder Structure

```
src/
  app/                        ← Next.js App Router only
    app/[route]/
      _components/            ← route-specific components
      page.tsx
  components/
    ui/                       ← Button, Input, Card, Modal, Badge, Spinner…
    layout/                   ← Header, Footer, UniversalHeader
    property/                 ← PropertyCard, PropertyImage, PropertyBadges…
    admin/                    ← AdminPanel section components
  hooks/                      ← shared hooks
  lib/
    api.ts                    ← RTK Query createApi (replaces app/lib/api.ts)
    utils.ts
  types/                      ← all TypeScript types
  constants/                  ← mappings, preferences, lifestyle features
  store/                      ← Redux store + slices
```

---

## Phase 1: Purge

---

### Task 1: Delete dead source files

**Files:**
- Delete: `src/app/store/slices/operatorSlice.simplified.ts`
- Delete: `src/app/contexts/AuthContext.tsx`
- Delete: `src/app/auth/` (entire directory)
- Delete: `src/features/README.md`
- Delete: `src/entities/README.md`
- Delete: `src/widgets/README.md`
- Delete: `src/features/profile/update-profile/ui/INTEGRATION_NOTES.md`

- [ ] **Step 1: Delete the files**

```bash
cd frontend
rm src/app/store/slices/operatorSlice.simplified.ts
rm src/app/contexts/AuthContext.tsx
rm -rf src/app/auth
rm src/features/README.md
rm src/entities/README.md
rm src/widgets/README.md
rm src/features/profile/update-profile/ui/INTEGRATION_NOTES.md
```

- [ ] **Step 2: Verify no imports reference the deleted files**

```bash
grep -r "AuthContext\|operatorSlice.simplified\|app/auth/components" src --include="*.ts" --include="*.tsx"
```

Expected: no output (zero matches).

- [ ] **Step 3: Run type-check**

```bash
npm run type-check
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete dead source files (AuthContext placeholder, simplified slice, old auth dir)"
```

---

### Task 2: Audit and remove unused public assets

**Files:**
- Modify: `public/` (remove unused files)

- [ ] **Step 1: Find all image references in source code**

```bash
grep -r "public/" src --include="*.tsx" --include="*.ts" | grep -oE '\"[^\"]+\.(png|jpg|jpeg|svg|avif|ico|webp)\"' | sort -u
```

Also check for references without the `public/` prefix (Next.js `<Image>` uses `/filename.ext`):
```bash
grep -rE 'src=\{?["\x27]/[a-z]' src --include="*.tsx" | grep -oE '["\x27]/[^"\x27]+\.(png|jpg|jpeg|svg|avif|webp)' | sort -u
```

- [ ] **Step 2: Delete confirmed-unused dev assets**

These files are personal photos and test images with no legitimate product use:
```bash
cd frontend/public
rm -f dima.png dima.jpg artur.jpeg ilya.avif uncle.png uncle.svg octopus.png
rm -f 64.png 128.png
rm -f verify-tenant-icon.png   # keep verify-tenant-icon.svg
rm -f .DS_Store
```

- [ ] **Step 3: Cross-reference remaining files against usage**

For each file still in `public/`, confirm it appears in at least one grep result from Step 1. Delete any that have zero references.

- [ ] **Step 4: Build to confirm nothing broke**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds, no missing image errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove unused public assets (dev photos, duplicate icons)"
```

---

### Task 3: Replace PrimeReact InputMask with react-imask

**Context:** PrimeReact is only used in 2 files (`src/shared/ui/PhoneMaskInput/PhoneMaskInput.tsx` and `src/components/ui/PhoneMaskInput/PhoneMaskInput.tsx`) for `InputMask`. `react-imask` is already in `package.json`. The mask format must be converted: PrimeReact uses `9` for required digit; IMask uses `0` for required digit.

**Files:**
- Modify: `src/shared/lib/phoneMasks.ts`
- Modify: `src/shared/ui/PhoneMaskInput/PhoneMaskInput.tsx`
- Modify: `src/components/ui/PhoneMaskInput/PhoneMaskInput.tsx`
- Modify: `frontend/package.json`

- [ ] **Step 1: Update phoneMasks.ts to use IMask format**

In `src/shared/lib/phoneMasks.ts`, replace all `9` digit placeholders with `0` (IMask required-digit character). The file currently starts with:
```ts
// Phone masks for InputMask component (9 = digit placeholder)
export const phoneMasks: Record<string, string> = {
  AC: "9999",
  AD: "999-999",
  ...
```

Run a global replace in the file:
```bash
sed -i '' 's/"9/\"0/g; s/9"/0"/g; s/9-/0-/g; s/-9/-0/g; s/9)/0)/g; s/(9/(0/g; s/99/00/g' src/shared/lib/phoneMasks.ts
```

Then update the comment at the top of the file:
```ts
// Phone masks for IMaskInput (0 = required digit placeholder)
// Source: https://gist.github.com/mikemunsie/d58d88cad0281e4b187b0effced769b2
// Converted from # to 0 format for react-imask
```

- [ ] **Step 2: Replace PhoneMaskInput implementation (shared/ui version)**

Replace the entire content of `src/shared/ui/PhoneMaskInput/PhoneMaskInput.tsx`. The only change is swapping `InputMask` from PrimeReact for `IMaskInput` from react-imask and updating the event handler:

```tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { IMaskInput } from "react-imask";
import { ChevronDown, Search } from "lucide-react";
import { getPhoneMask } from "../../lib/phoneMasks";
import {
  COUNTRIES,
  getCountryByCode,
  getDefaultCountry,
  type Country,
} from "../../lib/countries";

export interface PhoneMaskInputProps {
  countryCode?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onCountryChange?: (countryCode: string) => void;
}

export default function PhoneMaskInput({
  countryCode: initialCountryCode = "US",
  value,
  onChange,
  label,
  placeholder,
  className = "",
  disabled = false,
  required = false,
  error,
  onCountryChange,
}: PhoneMaskInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    () => getCountryByCode(initialCountryCode) || getDefaultCountry(),
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const country = getCountryByCode(initialCountryCode);
    if (country) setSelectedCountry(country);
  }, [initialCountryCode]);

  const mask = getPhoneMask(selectedCountry.code);
  const displayPlaceholder = placeholder || "";

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery("");
    onChange("");
    onCountryChange?.(country.code);
  };

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) setSearchQuery("");
  }, [isDropdownOpen]);

  const hasValue = !!value;

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex">
        {/* Country Code Selector */}
        <div className="relative min-w-[11rem] max-w-[13rem] flex-shrink-0">
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="flex items-center cursor-pointer justify-between gap-2 px-5 py-4 bg-white rounded-l-4xl hover:bg-gray-50 transition-colors h-full w-full disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-gray-700 truncate leading-tight">
                {selectedCountry.name}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {selectedCountry.dialCode}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && !disabled && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-3xl max-h-60 overflow-hidden flex flex-col backdrop-blur-[3px]">
                <div
                  className="relative rounded-3xl"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%), rgba(0,0,0,0.5)",
                    boxShadow: "0 1.5625rem 3.125rem rgba(0,0,0,0.4), 0 0.625rem 1.875rem rgba(0,0,0,0.2), inset 0 0.0625rem 0 rgba(255,255,255,0.1), inset 0 -0.0625rem 0 rgba(0,0,0,0.2)",
                  }}
                >
                  <div className="relative z-10">
                    <div className="p-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Search country..."
                          className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/50 text-base focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountryChange(country)}
                            className={`w-full px-5 py-3 text-left transition-all duration-200 flex cursor-pointer items-center gap-3 ${selectedCountry.code === country.code ? "bg-white/18 text-white" : "text-white hover:bg-white/12"}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate">{country.name}</div>
                              <div className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{country.dialCode}</div>
                            </div>
                            {selectedCountry.code === country.code && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-white/70 text-center">No countries found</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Phone Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <IMaskInput
              mask={mask}
              value={value ?? ""}
              onAccept={(val: string) => onChange(val || undefined)}
              placeholder={displayPlaceholder}
              disabled={disabled}
              required={required}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full px-6 pt-8 pb-4 rounded-r-4xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-gray-400 ${error ? "ring-2 ring-red-400 focus:ring-red-500" : ""}`}
            />
            <label
              className={`absolute left-6 pointer-events-none transition-all duration-200 ${isFocused || hasValue ? "top-3 text-xs text-gray-600" : "top-1/2 -translate-y-1/2 text-base text-gray-500"}`}
            >
              {label}
            </label>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-1 px-6">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Apply the same change to src/components/ui/PhoneMaskInput/PhoneMaskInput.tsx**

Copy the exact same file content from Step 2 into `src/components/ui/PhoneMaskInput/PhoneMaskInput.tsx`. The two files are identical — they'll be deduplicated in Phase 2.

- [ ] **Step 4: Remove PrimeReact from package.json**

```bash
npm uninstall primereact primeicons
```

- [ ] **Step 5: Run type-check and build**

```bash
npm run type-check && npm run build 2>&1 | tail -20
```

Expected: zero errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: replace PrimeReact InputMask with react-imask, remove primereact dep"
```

---

### Task 4: Delete backend leftover files

**Files:**
- Delete: `backend/src/modules/properties/properties.service.old.txt`
- Delete: `backend/src/modules/properties/properties.controller.old.txt`
- Delete: `backend/src/modules/properties/properties.service.refactored.old.txt`

- [ ] **Step 1: Delete the files**

```bash
rm backend/src/modules/properties/properties.service.old.txt
rm backend/src/modules/properties/properties.controller.old.txt
rm backend/src/modules/properties/properties.service.refactored.old.txt
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: delete backend leftover .old.txt files"
```

---

## Phase 2: Consolidate

---

### Task 5: Add missing tsconfig path aliases and create target directories

**Files:**
- Modify: `frontend/tsconfig.json`
- Create directories (no file content, just structure)

- [ ] **Step 1: Add @/store and @/constants aliases to tsconfig.json**

Update `frontend/tsconfig.json` paths section:
```json
"paths": {
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/types/*": ["./src/types/*"],
  "@/hooks/*": ["./src/hooks/*"],
  "@/utils/*": ["./src/utils/*"],
  "@/store/*": ["./src/store/*"],
  "@/constants/*": ["./src/constants/*"]
}
```

- [ ] **Step 2: Create target directories**

```bash
cd frontend
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/property
mkdir -p src/components/admin
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/constants
mkdir -p src/store/slices
```

- [ ] **Step 3: Verify type-check still passes**

```bash
npm run type-check
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add @/store and @/constants path aliases, create target directories"
```

---

### Task 6: Consolidate all TypeScript types into src/types/

**Context:** Types are currently spread across `src/types/`, `src/app/types/`, `src/shared/types/`, and `src/entities/*/model/`. Goal: one canonical `src/types/` with a single `index.ts` export.

**Files:**
- Create/merge: `src/types/user.ts`, `src/types/property.ts`, `src/types/building.ts`, `src/types/preferences.ts`, `src/types/booking.ts`, `src/types/api.ts`, `src/types/common.ts`
- Create: `src/types/index.ts`
- Delete: `src/app/types/`, `src/shared/types/`, `src/entities/preferences/model/`, `src/entities/user/model/`

- [ ] **Step 1: Review all existing type files to find duplicates**

```bash
cat src/types/user.ts
cat src/app/types/index.ts
cat src/shared/types/index.ts 2>/dev/null || echo "not found"
```

Note any types that appear in multiple files — keep the most complete version.

- [ ] **Step 2: Create merged src/types/index.ts that re-exports everything**

After reviewing, create `src/types/index.ts` that consolidates everything:
```ts
// Single source of truth for all shared TypeScript types.
// Import from "@/types" anywhere in the codebase.

export * from './user';
export * from './property';
export * from './building';
export * from './preferences';
export * from './booking';
export * from './api';
export * from './common';
```

Move each type file into `src/types/` (e.g. `src/app/types/property.ts` → `src/types/property.ts`), deduplicating as you go.

- [ ] **Step 3: Update all imports that reference the old type locations**

```bash
# Find all files importing from old type paths
grep -rn 'from "@/app/types\|from "@/shared/types\|from "@/entities/preferences/model\|from "@/entities/user' src --include="*.ts" --include="*.tsx"
```

For each result, update the import to `from "@/types"` or the specific file like `from "@/types/property"`.

- [ ] **Step 4: Delete old type directories**

```bash
rm -rf src/app/types
rm -rf src/shared/types
rm -rf src/entities/preferences/model
rm -rf src/entities/user/model
```

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```

Expected: zero errors. Fix any import errors before proceeding.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: consolidate all types into src/types/"
```

---

### Task 7: Consolidate constants into src/constants/

**Files:**
- Merge: `src/app/constants/` + `src/shared/constants/` → `src/constants/`
- Delete: `src/app/constants/`, `src/shared/constants/`

- [ ] **Step 1: Move files**

```bash
cp src/app/constants/preferences.ts src/constants/preferences.ts
cp src/app/constants/lifestyleFeatures.ts src/constants/lifestyleFeatures.ts
cp src/shared/constants/mappings.ts src/constants/mappings.ts
```

Check for any duplicates between the two directories first:
```bash
ls src/app/constants && ls src/shared/constants
```

- [ ] **Step 2: Create src/constants/index.ts**

```ts
export * from './mappings';
export * from './preferences';
export * from './lifestyleFeatures';
```

- [ ] **Step 3: Update all imports**

```bash
grep -rn 'from "@/app/constants\|from "@/shared/constants' src --include="*.ts" --include="*.tsx"
```

Update each to use `@/constants` or `@/constants/mappings` etc.

- [ ] **Step 4: Delete old directories**

```bash
rm -rf src/app/constants
rm -rf src/shared/constants
```

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: consolidate constants into src/constants/"
```

---

### Task 8: Move Redux store to src/store/

**Files:**
- Move: `src/app/store/store.ts` → `src/store/store.ts`
- Move: `src/app/store/hooks.ts` → `src/store/hooks.ts`
- Move: `src/app/store/slices/*.ts` → `src/store/slices/*.ts`
- Delete: `src/app/store/`

- [ ] **Step 1: Copy store files to new location**

```bash
cp src/app/store/store.ts src/store/store.ts
cp src/app/store/hooks.ts src/store/hooks.ts
cp src/app/store/slices/authSlice.ts src/store/slices/authSlice.ts
cp src/app/store/slices/usersSlice.ts src/store/slices/usersSlice.ts
cp src/app/store/slices/operatorSlice.ts src/store/slices/operatorSlice.ts
cp src/app/store/slices/shortlistSlice.ts src/store/slices/shortlistSlice.ts
cp src/app/store/slices/apiSlice.ts src/store/slices/apiSlice.ts
```

- [ ] **Step 2: Update all internal imports within moved files**

In `src/store/store.ts`, update the import of `preferencesReducer`:
```ts
// Before:
import { preferencesReducer } from "@/features/preferences/model";
// After — will be updated in Task 14 when features are colocated:
import { preferencesReducer } from "@/store/slices/preferencesSlice";
```

Move the preferences slice as well:
```bash
cp src/features/preferences/model/preferencesSlice.ts src/store/slices/preferencesSlice.ts
```

Update `src/store/slices/preferencesSlice.ts` to remove any FSD-specific imports if present.

- [ ] **Step 3: Update all imports across the codebase**

```bash
grep -rn 'from "@/app/store' src --include="*.ts" --include="*.tsx"
```

Replace every occurrence:
- `@/app/store/store` → `@/store/store`
- `@/app/store/hooks` → `@/store/hooks`
- `@/app/store/slices/authSlice` → `@/store/slices/authSlice`
- `@/app/store/slices/usersSlice` → `@/store/slices/usersSlice`
- `@/app/store/slices/operatorSlice` → `@/store/slices/operatorSlice`
- `@/app/store/slices/shortlistSlice` → `@/store/slices/shortlistSlice`
- `@/app/store/slices/apiSlice` → `@/store/slices/apiSlice`

Also update `@/features/preferences/model` imports that reference the slice:
```bash
grep -rn 'from "@/features/preferences/model"' src --include="*.ts" --include="*.tsx"
```
Replace with `from "@/store/slices/preferencesSlice"`.

- [ ] **Step 4: Update src/app/layout.tsx or store provider**

Find where the Redux `<Provider>` wraps the app and verify it still imports from the new path:
```bash
grep -rn 'store\|Provider\|StoreProvider' src/app --include="*.tsx" | head -10
```

Update any store imports found.

- [ ] **Step 5: Delete src/app/store/**

```bash
rm -rf src/app/store
```

- [ ] **Step 6: Run type-check**

```bash
npm run type-check
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: move Redux store from src/app/store/ to src/store/"
```

---

### Task 9: Move and consolidate UI components to src/components/ui/

**Context:** UI primitives exist in `src/shared/ui/` and partially duplicated in `src/components/ui/`. Goal: one canonical `src/components/ui/`.

**Files:**
- Merge: `src/shared/ui/*` → `src/components/ui/`
- Resolve duplicate: `PhoneMaskInput` exists in both — keep `src/components/ui/PhoneMaskInput/`
- Delete: `src/shared/ui/`

- [ ] **Step 1: List both UI directories to identify overlaps**

```bash
ls src/shared/ui && echo "---" && ls src/components/ui
```

- [ ] **Step 2: Move non-duplicate components from shared/ui**

For each component in `src/shared/ui/` that does NOT already exist in `src/components/ui/`:
```bash
cp -r src/shared/ui/Badge src/components/ui/Badge
cp -r src/shared/ui/Button src/components/ui/Button
cp -r src/shared/ui/Card src/components/ui/Card
cp -r src/shared/ui/Container src/components/ui/Container
cp -r src/shared/ui/CountryDropdown src/components/ui/CountryDropdown
cp -r src/shared/ui/DateInput src/components/ui/DateInput
cp -r src/shared/ui/DetailsCard src/components/ui/DetailsCard
cp -r src/shared/ui/FormField src/components/ui/FormField
cp -r src/shared/ui/Input src/components/ui/Input
cp -r src/shared/ui/Modal src/components/ui/Modal
cp -r src/shared/ui/Spinner src/components/ui/Spinner
cp -r src/shared/ui/Stack src/components/ui/Stack
cp -r src/shared/ui/Textarea src/components/ui/Textarea
cp -r src/shared/ui/tokens src/components/ui/tokens
# PhoneMaskInput already exists in src/components/ui/ — skip
```

- [ ] **Step 3: Create src/components/ui/index.ts**

```ts
export * from './Badge/FeaturedBadge';
export * from './Button/Button';
export * from './Card/Card';
export * from './Container/Container';
export * from './CountryDropdown/CountryDropdown';
export * from './DateInput/DateInput';
export * from './DetailsCard/DetailsCard';
export * from './FormField/FormField';
export * from './Input/Input';
export * from './Modal/ConfirmModal';
export * from './PhoneMaskInput/PhoneMaskInput';
export * from './Spinner/LoadingSpinner';
export * from './Stack/Stack';
export * from './Textarea/Textarea';
```

- [ ] **Step 4: Update all imports from shared/ui**

```bash
grep -rn 'from "@/shared/ui' src --include="*.ts" --include="*.tsx"
```

Replace `@/shared/ui` with `@/components/ui`.

- [ ] **Step 5: Delete src/shared/ui/**

```bash
rm -rf src/shared/ui
```

- [ ] **Step 6: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: merge shared/ui into components/ui, remove duplicate PhoneMaskInput"
```

---

### Task 10: Move layout components to src/components/layout/

**Files:**
- Move from `src/app/components/`: `Header.tsx`, `Footer.tsx`, `Logo.tsx`, `UniversalHeader.tsx`, `TenantUniversalHeader.tsx`, `DashboardHeader.tsx`, `UserDropdown.tsx`, `LanguageDropdown.tsx`

- [ ] **Step 1: Move files**

```bash
cp src/app/components/Header.tsx src/components/layout/Header.tsx
cp src/app/components/Footer.tsx src/components/layout/Footer.tsx
cp src/app/components/Logo.tsx src/components/layout/Logo.tsx
cp src/app/components/UniversalHeader.tsx src/components/layout/UniversalHeader.tsx
cp src/app/components/TenantUniversalHeader.tsx src/components/layout/TenantUniversalHeader.tsx
cp src/app/components/DashboardHeader.tsx src/components/layout/DashboardHeader.tsx
cp src/app/components/UserDropdown.tsx src/components/layout/UserDropdown.tsx
cp src/app/components/LanguageDropdown.tsx src/components/layout/LanguageDropdown.tsx
```

- [ ] **Step 2: Create src/components/layout/index.ts**

```ts
export { default as Header } from './Header';
export { default as Footer } from './Footer';
export { default as Logo } from './Logo';
export { default as UniversalHeader } from './UniversalHeader';
export { default as TenantUniversalHeader } from './TenantUniversalHeader';
export { default as DashboardHeader } from './DashboardHeader';
export { default as UserDropdown } from './UserDropdown';
export { default as LanguageDropdown } from './LanguageDropdown';
```

- [ ] **Step 3: Update imports across the codebase**

```bash
grep -rn '".*components/Header\|".*components/Footer\|".*components/Logo\|".*components/UniversalHeader\|".*components/DashboardHeader\|".*components/UserDropdown\|".*components/LanguageDropdown' src --include="*.tsx" --include="*.ts"
```

Update each to `@/components/layout/ComponentName` or `@/components/layout`.

- [ ] **Step 4: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: move layout components to src/components/layout/"
```

---

### Task 11: Move property components to src/components/property/

**Files:**
- Move from `src/entities/property/ui/`: `PropertyCard.tsx`, `PropertyImage.tsx`, `PropertyBadges.tsx`, `PropertyCardSkeleton.tsx`, `PropertyContent.tsx`, `PropertyHeader.tsx`, `PropertyHero.tsx`, `PropertyLocation.tsx`, `PropertyDetails.tsx`, `PropertyAmenities.tsx`, `PropertyPriceCard.tsx`, `MatchBadgeTooltip.tsx`
- Move from `src/app/components/`: `PropertyCard.tsx` (if different), `EnhancedPropertyCard.tsx`, `ImageGallery.tsx`, `ImageSlider.tsx`, `PropertyMapGoogle.tsx`

- [ ] **Step 1: Move entity property UI components**

```bash
cp -r src/entities/property/ui/. src/components/property/
```

- [ ] **Step 2: Move additional property components from app/components/**

```bash
cp src/app/components/EnhancedPropertyCard.tsx src/components/property/EnhancedPropertyCard.tsx
cp src/app/components/ImageGallery.tsx src/components/property/ImageGallery.tsx
cp src/app/components/ImageSlider.tsx src/components/property/ImageSlider.tsx
cp src/app/components/PropertyMapGoogle.tsx src/components/property/PropertyMapGoogle.tsx
cp src/app/components/PropertyBadges.tsx src/components/property/PropertyBadges.tsx 2>/dev/null || true
cp src/app/components/PropertyCardSkeleton.tsx src/components/property/PropertyCardSkeleton.tsx 2>/dev/null || true
```

Note: if `PropertyCard.tsx` exists in both `entities/property/ui/` and `app/components/`, compare them and keep the most complete version.

- [ ] **Step 3: Create src/components/property/index.ts**

```ts
export { default as PropertyCard } from './PropertyCard';
export { default as EnhancedPropertyCard } from './EnhancedPropertyCard';
export { default as PropertyImage } from './PropertyImage';
export { default as PropertyBadges } from './PropertyBadges';
export { default as PropertyCardSkeleton } from './PropertyCardSkeleton';
export { default as PropertyContent } from './PropertyContent';
export { default as PropertyHeader } from './PropertyHeader';
export { default as PropertyHero } from './PropertyHero';
export { default as PropertyLocation } from './PropertyLocation';
export { default as PropertyDetails } from './PropertyDetails';
export { default as PropertyAmenities } from './PropertyAmenities';
export { default as PropertyPriceCard } from './PropertyPriceCard';
export { default as MatchBadgeTooltip } from './MatchBadgeTooltip';
export { default as ImageGallery } from './ImageGallery';
export { default as ImageSlider } from './ImageSlider';
export { default as PropertyMapGoogle } from './PropertyMapGoogle';
```

- [ ] **Step 4: Update all imports**

```bash
grep -rn 'from "@/entities/property\|from ".*components/PropertyCard\|from ".*components/EnhancedPropertyCard\|from ".*components/ImageGallery' src --include="*.ts" --include="*.tsx"
```

Update to `@/components/property`.

- [ ] **Step 5: Delete src/entities/property/**

```bash
rm -rf src/entities/property
```

- [ ] **Step 6: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: move property components to src/components/property/"
```

---

### Task 12: Move admin components to src/components/admin/

**Files:**
- Move from `src/app/components/`: `AdminBuildingsSection.tsx`, `AdminPropertiesSection.tsx`, `AdminRequestsSection.tsx`, `AdminUsersSection.tsx`, `AdminUsersSection.tsx`
- Move from `src/widgets/admin/AdminPanel/hooks/`: `useAdminActions.ts`, `useAdminData.ts`, `useNotifications.ts`

- [ ] **Step 1: Move components**

```bash
cp src/app/components/AdminBuildingsSection.tsx src/components/admin/AdminBuildingsSection.tsx
cp src/app/components/AdminPropertiesSection.tsx src/components/admin/AdminPropertiesSection.tsx
cp src/app/components/AdminRequestsSection.tsx src/components/admin/AdminRequestsSection.tsx
cp src/app/components/AdminUsersSection.tsx src/components/admin/AdminUsersSection.tsx
mkdir -p src/components/admin/hooks
cp src/widgets/admin/AdminPanel/hooks/useAdminActions.ts src/components/admin/hooks/useAdminActions.ts
cp src/widgets/admin/AdminPanel/hooks/useAdminData.ts src/components/admin/hooks/useAdminData.ts
cp src/widgets/admin/AdminPanel/hooks/useNotifications.ts src/components/admin/hooks/useNotifications.ts
```

- [ ] **Step 2: Update imports within admin hooks**

The admin hooks import from `@/app/lib/api` — that will be fixed in Phase 3. For now just update any internal cross-references between the moved files.

- [ ] **Step 3: Update all imports that reference admin components**

```bash
grep -rn 'AdminBuildingsSection\|AdminPropertiesSection\|AdminRequestsSection\|AdminUsersSection\|useAdminActions\|useAdminData' src --include="*.ts" --include="*.tsx"
```

Update to `@/components/admin/...`.

- [ ] **Step 4: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: move admin components and hooks to src/components/admin/"
```

---

### Task 13: Move shared hooks to src/hooks/

**Files:**
- Move from `src/app/hooks/`: all `.ts` files
- Move from `src/shared/hooks/`: `useUnifiedProfile.ts`, `useUserProfile.ts`, `useLocalizedFormOptions.ts`
- Delete: `src/shared/hooks/`, `src/app/hooks/`

- [ ] **Step 1: Move app hooks**

```bash
cp src/app/hooks/useAuth.ts src/hooks/useAuth.ts
cp src/app/hooks/useDebounce.ts src/hooks/useDebounce.ts
cp src/app/hooks/useFormValidation.ts src/hooks/useFormValidation.ts
cp src/app/hooks/useOnboarding.ts src/hooks/useOnboarding.ts
cp src/app/hooks/usePreferences.ts src/hooks/usePreferences.ts
cp src/app/hooks/useProperties.ts src/hooks/useProperties.ts
cp src/app/hooks/usePropertyDetail.ts src/hooks/usePropertyDetail.ts
cp src/app/hooks/usePropertyForm.ts src/hooks/usePropertyForm.ts
cp src/app/hooks/usePropertyMatches.ts src/hooks/usePropertyMatches.ts
cp src/app/hooks/useShortlist.ts src/hooks/useShortlist.ts
cp src/app/hooks/useTenantDashboard.ts src/hooks/useTenantDashboard.ts
cp src/app/hooks/useTranslation.ts src/hooks/useTranslation.ts
```

- [ ] **Step 2: Move shared hooks**

```bash
cp src/shared/hooks/useUnifiedProfile.ts src/hooks/useUnifiedProfile.ts
cp src/shared/hooks/useUserProfile.ts src/hooks/useUserProfile.ts
cp src/shared/api/hooks/useLocalizedFormOptions.ts src/hooks/useLocalizedFormOptions.ts 2>/dev/null || true
```

- [ ] **Step 3: Create src/hooks/index.ts**

```ts
export { default as useAuth } from './useAuth';
export { useDebounce, useDebouncedApiCall } from './useDebounce';
export { default as useProperties } from './useProperties';
export { default as usePropertyMatches } from './usePropertyMatches';
export { default as useShortlist } from './useShortlist';
export { default as useTranslation } from './useTranslation';
// add remaining hooks as needed
```

- [ ] **Step 4: Update all imports**

```bash
grep -rn 'from "@/app/hooks\|from "@/shared/hooks' src --include="*.ts" --include="*.tsx"
```

Replace with `@/hooks/hookName`.

- [ ] **Step 5: Delete old hook directories**

```bash
rm -rf src/app/hooks
rm -rf src/shared/hooks
```

- [ ] **Step 6: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: consolidate hooks into src/hooks/"
```

---

### Task 14: Colocate route-specific components and delete FSD folders

**Context:** Components used by only one route should live at `src/app/app/[route]/_components/`. After moving, the FSD folders (`features/`, `entities/`, `widgets/`, `shared/`) should be empty enough to delete.

**Files:**
- Move: `src/features/preferences/` → `src/app/app/preferences/_components/`
- Move: `src/features/profile/` → `src/app/app/profile/_components/`
- Move: `src/features/shortlist/` → `src/app/app/shortlist/_components/`
- Move: `src/features/property/edit-property/` → `src/app/app/properties/_components/edit/`
- Move: `src/widgets/property/` → `src/components/property/` (grids/loaders are shared)
- Delete: `src/features/`, `src/entities/`, `src/widgets/`, `src/shared/`

- [ ] **Step 1: Colocate preferences feature**

```bash
mkdir -p src/app/app/preferences/_components
cp -r src/features/preferences/lib/. src/app/app/preferences/_components/
# preferencesSlice already moved to src/store/slices/ in Task 8
```

Update imports in `src/app/app/preferences/page.tsx` and any other file referencing `@/features/preferences`.

- [ ] **Step 2: Colocate profile feature**

```bash
mkdir -p src/app/app/profile/_components
cp -r src/features/profile/update-profile/ui/. src/app/app/profile/_components/
cp src/features/profile/update-profile/lib/useProfileForm.ts src/hooks/useProfileForm.ts
cp src/features/profile/update-profile/model/useProfileUpdate.ts src/hooks/useProfileUpdate.ts
```

Update imports in `src/app/app/profile/page.tsx`.

- [ ] **Step 3: Colocate shortlist feature**

The shortlist hook is already going to `src/hooks/useShortlist.ts` (Task 13). Move the UI toggle button:
```bash
mkdir -p src/app/app/shortlist/_components
cp src/features/shortlist/ui/ShortlistToggleButton.tsx src/app/app/shortlist/_components/ShortlistToggleButton.tsx
```

- [ ] **Step 4: Move property grid widgets to src/components/property/**

```bash
cp src/widgets/property/PropertyGridWithLoader.tsx src/components/property/PropertyGridWithLoader.tsx
cp src/widgets/property/MatchedPropertyGridWithLoader.tsx src/components/property/MatchedPropertyGridWithLoader.tsx
```

Update imports:
```bash
grep -rn 'from "@/widgets/property' src --include="*.ts" --include="*.tsx"
```

- [ ] **Step 5: Verify nothing left in FSD folders that isn't already moved**

```bash
find src/features src/entities src/widgets src/shared -type f -name "*.ts" -o -name "*.tsx" | grep -v node_modules
```

Expected: only index.ts barrel files (if any). Move anything unexpected before deleting.

- [ ] **Step 6: Delete FSD folders**

```bash
rm -rf src/features
rm -rf src/entities
rm -rf src/widgets
rm -rf src/shared
```

- [ ] **Step 7: Run type-check**

```bash
npm run type-check
```

Expected: zero errors. Fix any remaining broken imports before proceeding.

- [ ] **Step 8: Run build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: colocate route-specific components, delete FSD layer folders"
```

---

## Phase 3: API Migration (RTK Query)

---

### Task 15: Create the new src/lib/api.ts with all endpoints

**Context:** This replaces `src/app/lib/api.ts`. The new file uses RTK Query `createApi` with tag-based cache invalidation. A custom `baseQuery` wrapper handles the 401 → logout flow. File uploads use `FormData` mutations.

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Create src/lib/api.ts**

```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { logout } from "@/store/slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  credentials: "include",
});

// Mirror the 401-intercept logic from the old axios instance.
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (
        !path.includes("/preferences") &&
        !path.includes("/auth") &&
        !path.includes("/onboarding")
      ) {
        api.dispatch(logout());
      }
    }
    return result;
  };

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "User",
    "Property",
    "Building",
    "Preferences",
    "Shortlist",
    "BookingRequest",
    "TenantCV",
    "Matching",
    "Operator",
  ],
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  keepUnusedDataFor: 300,

  endpoints: (builder) => ({
    // ─── Auth ────────────────────────────────────────────────────────────────
    login: builder.mutation<any, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    register: builder.mutation<any, any>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    checkUser: builder.mutation<any, { email: string }>({
      query: (body) => ({ url: "/auth/check-user", method: "POST", body }),
    }),
    authenticate: builder.mutation<any, { email: string; password: string; role?: string; rememberMe?: boolean }>({
      query: (body) => ({ url: "/auth/authenticate", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    googleAuth: builder.mutation<any, { token: string }>({
      query: (body) => ({ url: "/auth/google", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["User", "Preferences", "Shortlist"],
    }),
    getMe: builder.query<any, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    // ─── Users ───────────────────────────────────────────────────────────────
    getProfile: builder.query<any, void>({
      query: () => "/users/profile",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation<any, any>({
      query: (body) => ({ url: "/users/profile", method: "PUT", body }),
      invalidatesTags: ["User"],
    }),
    uploadAvatar: builder.mutation<any, FormData>({
      query: (body) => ({
        url: "/users/avatar",
        method: "POST",
        body,
        // Let browser set content-type with boundary for multipart
        formData: true,
      }),
      invalidatesTags: ["User"],
    }),
    getAllUsers: builder.query<any, { page?: number; limit?: number; role?: string; search?: string } | void>({
      query: (params) => ({ url: "/users", params: params ?? undefined }),
      providesTags: ["User"],
    }),
    getUserById: builder.query<any, string>({
      query: (id) => `/users/${id}`,
      providesTags: ["User"],
    }),
    updateUser: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["User"],
    }),
    updateUserRole: builder.mutation<any, { userId: string; role: string }>({
      query: ({ userId, role }) => ({ url: `/users/${userId}/role`, method: "PUT", body: { role } }),
      invalidatesTags: ["User"],
    }),

    // ─── Properties ──────────────────────────────────────────────────────────
    getProperties: builder.query<any, any>({
      query: (params) => ({ url: "/properties", params }),
      providesTags: ["Property"],
    }),
    getProperty: builder.query<any, string>({
      query: (id) => `/properties/${id}`,
      providesTags: ["Property"],
    }),
    getPublicProperty: builder.query<any, string>({
      query: (id) => `/properties/public/${id}`,
      providesTags: ["Property"],
    }),
    getAllPublicProperties: builder.query<any, any>({
      query: (params) => ({ url: "/properties/public/all", params }),
      providesTags: ["Property"],
    }),
    createProperty: builder.mutation<any, any>({
      query: (body) => ({ url: "/properties", method: "POST", body }),
      invalidatesTags: ["Property", "Matching"],
    }),
    updateProperty: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/properties/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Property", "Matching"],
    }),
    deleteProperty: builder.mutation<any, string>({
      query: (id) => ({ url: `/properties/${id}`, method: "DELETE" }),
      invalidatesTags: ["Property", "Matching"],
    }),

    // ─── Buildings ───────────────────────────────────────────────────────────
    getBuildings: builder.query<any, any>({
      query: (params) => ({ url: "/buildings", params }),
      providesTags: ["Building"],
    }),
    getBuilding: builder.query<any, string>({
      query: (id) => `/buildings/${id}`,
      providesTags: ["Building"],
    }),
    getPublicBuilding: builder.query<any, string>({
      query: (id) => `/buildings/public/${id}`,
      providesTags: ["Building"],
    }),
    getPublicBuildingProperties: builder.query<any, string>({
      query: (buildingId) => `/buildings/public/${buildingId}/properties`,
      providesTags: ["Building", "Property"],
    }),
    createBuilding: builder.mutation<any, any>({
      query: (body) => ({ url: "/buildings", method: "POST", body }),
      invalidatesTags: ["Building"],
    }),
    updateBuilding: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/buildings/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Building"],
    }),
    deleteBuilding: builder.mutation<any, string>({
      query: (id) => ({ url: `/buildings/${id}`, method: "DELETE" }),
      invalidatesTags: ["Building"],
    }),
    getBuildingOperators: builder.query<any, void>({
      query: () => "/buildings/operators",
      providesTags: ["Operator"],
    }),
    uploadBuildingLogo: builder.mutation<any, { id: string; file: FormData }>({
      query: ({ id, file }) => ({ url: `/buildings/${id}/logo`, method: "POST", body: file, formData: true }),
      invalidatesTags: ["Building"],
    }),
    uploadBuildingPhotos: builder.mutation<any, { id: string; files: FormData }>({
      query: ({ id, files }) => ({ url: `/buildings/${id}/photos`, method: "POST", body: files, formData: true }),
      invalidatesTags: ["Building"],
    }),
    uploadBuildingVideo: builder.mutation<any, { id: string; file: FormData }>({
      query: ({ id, file }) => ({ url: `/buildings/${id}/video`, method: "POST", body: file, formData: true }),
      invalidatesTags: ["Building"],
    }),
    uploadBuildingDocuments: builder.mutation<any, { id: string; files: FormData }>({
      query: ({ id, files }) => ({ url: `/buildings/${id}/documents`, method: "POST", body: files, formData: true }),
      invalidatesTags: ["Building"],
    }),

    // ─── Preferences ─────────────────────────────────────────────────────────
    getPreferences: builder.query<any, void>({
      query: () => "/preferences",
      providesTags: ["Preferences"],
    }),
    createPreferences: builder.mutation<any, any>({
      query: (body) => ({ url: "/preferences", method: "POST", body }),
      invalidatesTags: ["Preferences", "Matching"],
    }),
    updatePreferences: builder.mutation<any, any>({
      query: (body) => ({ url: "/preferences", method: "PUT", body }),
      invalidatesTags: ["Preferences", "Matching"],
    }),

    // ─── Matching ────────────────────────────────────────────────────────────
    getDetailedMatches: builder.query<any, { limit?: number } | void>({
      query: (params) => ({ url: "/matching", params: params ?? undefined }),
      providesTags: ["Matching"],
    }),
    getPropertyMatch: builder.query<any, string>({
      query: (propertyId) => `/matching/${propertyId}`,
      providesTags: ["Matching"],
    }),
    getMatchedPropertiesPaginated: builder.query<any, { page?: number; limit?: number; sortBy?: string; sortDirection?: string }>({
      query: (params) => ({ url: "/matching/paginated", params }),
      providesTags: ["Matching"],
    }),

    // ─── Shortlist ───────────────────────────────────────────────────────────
    getShortlist: builder.query<any, void>({
      query: () => "/shortlist",
      providesTags: ["Shortlist"],
    }),
    getShortlistCount: builder.query<any, void>({
      query: () => "/shortlist/count",
      providesTags: ["Shortlist"],
    }),
    checkShortlistStatus: builder.query<any, string>({
      query: (propertyId) => `/shortlist/check/${propertyId}`,
      providesTags: ["Shortlist"],
    }),
    addToShortlist: builder.mutation<any, string>({
      query: (propertyId) => ({ url: `/shortlist/${propertyId}`, method: "POST" }),
      invalidatesTags: ["Shortlist"],
    }),
    removeFromShortlist: builder.mutation<any, string>({
      query: (propertyId) => ({ url: `/shortlist/${propertyId}`, method: "DELETE" }),
      invalidatesTags: ["Shortlist"],
    }),
    clearShortlist: builder.mutation<any, void>({
      query: () => ({ url: "/shortlist", method: "DELETE" }),
      invalidatesTags: ["Shortlist"],
    }),

    // ─── Tenant CV ───────────────────────────────────────────────────────────
    getTenantCV: builder.query<any, void>({
      query: () => "/tenant-cv/current",
      providesTags: ["TenantCV"],
    }),
    getPublicTenantCV: builder.query<any, string>({
      query: (uuid) => `/tenant-cv/${uuid}`,
    }),
    updateTenantCV: builder.mutation<any, any>({
      query: (body) => ({ url: "/tenant-cv", method: "PUT", body }),
      invalidatesTags: ["TenantCV"],
    }),
    createTenantCVShare: builder.mutation<any, void>({
      query: () => ({ url: "/tenant-cv/share", method: "POST" }),
      invalidatesTags: ["TenantCV"],
    }),

    // ─── Booking Requests ────────────────────────────────────────────────────
    getBookingRequests: builder.query<any, { status?: string } | void>({
      query: (params) => ({ url: "/booking-requests", params: params ?? undefined }),
      providesTags: ["BookingRequest"],
    }),
    getMyBookingRequests: builder.query<any, { propertyId?: string } | void>({
      query: (params) => ({ url: "/booking-requests/mine", params: params ?? undefined }),
      providesTags: ["BookingRequest"],
    }),
    createBookingRequest: builder.mutation<any, any>({
      query: (body) => ({ url: "/booking-requests", method: "POST", body }),
      invalidatesTags: ["BookingRequest"],
    }),
    updateBookingStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/booking-requests/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["BookingRequest"],
    }),

    // ─── Operators (public) ──────────────────────────────────────────────────
    getOperators: builder.query<any, void>({
      query: () => "/residential-complexes/operators",
      providesTags: ["Operator"],
    }),
  }),
});

// Export auto-generated hooks
export const {
  useLoginMutation,
  useRegisterMutation,
  useCheckUserMutation,
  useAuthenticateMutation,
  useGoogleAuthMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUpdateUserRoleMutation,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetPublicPropertyQuery,
  useGetAllPublicPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useGetBuildingsQuery,
  useGetBuildingQuery,
  useGetPublicBuildingQuery,
  useGetPublicBuildingPropertiesQuery,
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
  useDeleteBuildingMutation,
  useGetBuildingOperatorsQuery,
  useUploadBuildingLogoMutation,
  useUploadBuildingPhotosMutation,
  useUploadBuildingVideoMutation,
  useUploadBuildingDocumentsMutation,
  useGetPreferencesQuery,
  useCreatePreferencesMutation,
  useUpdatePreferencesMutation,
  useGetDetailedMatchesQuery,
  useGetPropertyMatchQuery,
  useGetMatchedPropertiesPaginatedQuery,
  useGetShortlistQuery,
  useGetShortlistCountQuery,
  useCheckShortlistStatusQuery,
  useAddToShortlistMutation,
  useRemoveFromShortlistMutation,
  useClearShortlistMutation,
  useGetTenantCVQuery,
  useGetPublicTenantCVQuery,
  useUpdateTenantCVMutation,
  useCreateTenantCVShareMutation,
  useGetBookingRequestsQuery,
  useGetMyBookingRequestsQuery,
  useCreateBookingRequestMutation,
  useUpdateBookingStatusMutation,
  useGetOperatorsQuery,
} = api;
```

- [ ] **Step 2: Register the new api reducer in src/store/store.ts**

Ensure `src/store/store.ts` uses the new `api` from `@/lib/api`:
```ts
import { api } from "@/lib/api";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authSlice,
    // ... other slices
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ /* existing config */ }).concat(api.middleware),
});
```

Remove the import of the old `apiSlice` from `@/store/slices/apiSlice`.

- [ ] **Step 3: Run type-check**

```bash
npm run type-check
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: create RTK Query api.ts with all endpoints and 401 auth handling"
```

---

### Task 16: Migrate hooks from axios to RTK Query

**Context:** `src/hooks/useProperties.ts`, `src/hooks/usePropertyMatches.ts`, `src/hooks/useShortlist.ts`, `src/hooks/usePreferences.ts` all use raw axios via api.ts. Replace with RTK Query hooks.

**Files:**
- Modify: `src/hooks/useProperties.ts`
- Modify: `src/hooks/usePropertyMatches.ts`
- Modify: `src/hooks/useShortlist.ts`
- Modify: `src/hooks/usePreferences.ts`

- [ ] **Step 1: Rewrite useShortlist.ts**

This is the simplest migration — direct 1:1 swap:
```ts
"use client";
import { useGetShortlistQuery, useAddToShortlistMutation, useRemoveFromShortlistMutation, useClearShortlistMutation } from "@/lib/api";

export function useShortlist() {
  const { data: shortlist = [], isLoading } = useGetShortlistQuery();
  const [addToShortlist] = useAddToShortlistMutation();
  const [removeFromShortlist] = useRemoveFromShortlistMutation();
  const [clearShortlist] = useClearShortlistMutation();

  const toggle = async (propertyId: string) => {
    const isInList = shortlist.some((p: any) => p.id === propertyId || p.property?.id === propertyId);
    if (isInList) {
      await removeFromShortlist(propertyId);
    } else {
      await addToShortlist(propertyId);
    }
  };

  return { shortlist, isLoading, toggle, addToShortlist, removeFromShortlist, clearShortlist };
}
```

- [ ] **Step 2: Rewrite usePreferences.ts (partial — just the API call layer)**

The `src/hooks/usePreferences.ts` (762 lines) has complex state management for multi-step form. Only replace the API call layer, leave the form logic intact:

Find all `preferencesAPI.get()`, `preferencesAPI.create()`, `preferencesAPI.update()` calls. Replace:
- `await preferencesAPI.get()` → use `useGetPreferencesQuery` at the hook level
- `await preferencesAPI.create(data)` → `await createPreferences(data).unwrap()`
- `await preferencesAPI.update(data)` → `await updatePreferences(data).unwrap()`

Add at the top of the hook:
```ts
import { useGetPreferencesQuery, useCreatePreferencesMutation, useUpdatePreferencesMutation } from "@/lib/api";
```

Replace the axios calls and remove the `import { preferencesAPI } from "@/app/lib/api"` line.

- [ ] **Step 3: Rewrite useProperties.ts (API layer only)**

Replace `propertiesAPI.getAllPublic()` call:
```ts
// Before:
import { propertiesAPI } from "@/app/lib/api";
const response = await propertiesAPI.getAllPublic(params);

// After:
import { useGetAllPublicPropertiesQuery } from "@/lib/api";
const { data, isLoading } = useGetAllPublicPropertiesQuery(params);
```

Where the hook has `useEffect` + `useState` for loading, replace with the RTK Query `isLoading` and `data` directly.

- [ ] **Step 4: Run type-check**

```bash
npm run type-check
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: migrate shared hooks from axios to RTK Query"
```

---

### Task 17: Migrate page-level API calls in route files

**Context:** 10 route pages directly import from `@/app/lib/api` (or relative `lib/api`). Each needs their `useEffect` + axios calls replaced with RTK Query hooks.

**Files:**
- Modify: `src/app/app/matches/page.tsx`
- Modify: `src/app/app/properties/[id]/page.tsx`
- Modify: `src/app/app/operators/[id]/page.tsx`
- Modify: `src/app/app/auth/page.tsx`
- Modify: `src/app/app/auth/callback/page.tsx`
- Modify: `src/app/app/profile/page.tsx`
- Modify: `src/app/app/onboarding/page.tsx`
- Modify: `src/app/app/dashboard/admin/tenant/page.tsx`
- Modify: `src/app/app/admin/panel/page.tsx`

- [ ] **Step 1: Migrate matches/page.tsx**

Replace:
```ts
// Before:
import { matchingAPI, preferencesAPI, DetailedMatchingResult } from "../../lib/api";
const [detailedMatches, setDetailedMatches] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
  matchingAPI.getDetailedMatches(50).then(res => {
    setDetailedMatches(res.data.results);
    setLoading(false);
  });
}, []);

// After:
import { useGetDetailedMatchesQuery, useGetPreferencesQuery } from "@/lib/api";
const { data: matchData, isLoading } = useGetDetailedMatchesQuery({ limit: 50 });
const detailedMatches = matchData?.results ?? [];
```

Remove all local `isLoading`, `error`, `setDetailedMatches` state that RTK Query now provides.

- [ ] **Step 2: Migrate profile/page.tsx**

Replace `authAPI.updateProfile` with `useUpdateProfileMutation` and `authAPI.getProfile` with `useGetProfileQuery`.

- [ ] **Step 3: Migrate auth/callback/page.tsx**

Replace `authAPI.googleAuth` with `useGoogleAuthMutation`.

- [ ] **Step 4: Migrate admin/panel/page.tsx**

The admin panel imports several APIs. Replace each with the corresponding RTK Query hook. This page is 1291 lines — the bulk of the logic is in `src/components/admin/hooks/useAdminActions.ts` and `useAdminData.ts`. Migrate those hooks (Task 18) and the page imports will follow.

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: migrate route pages from axios to RTK Query hooks"
```

---

### Task 18: Migrate admin hooks to RTK Query

**Files:**
- Modify: `src/components/admin/hooks/useAdminActions.ts`
- Modify: `src/components/admin/hooks/useAdminData.ts`

- [ ] **Step 1: Migrate useAdminData.ts**

Replace all `usersAPI`, `buildingsAPI`, `propertiesAPI`, `bookingRequestsAPI` axios calls:
```ts
import {
  useGetAllUsersQuery,
  useGetBuildingsQuery,
  useGetPropertiesQuery,
  useGetBookingRequestsQuery,
} from "@/lib/api";

export function useAdminData() {
  const { data: users = [], isLoading: usersLoading } = useGetAllUsersQuery();
  const { data: buildings = [], isLoading: buildingsLoading } = useGetBuildingsQuery(undefined);
  const { data: properties = [], isLoading: propertiesLoading } = useGetPropertiesQuery(undefined);
  const { data: bookingRequests = [], isLoading: requestsLoading } = useGetBookingRequestsQuery();
  
  return {
    users, buildings, properties, bookingRequests,
    loading: usersLoading || buildingsLoading || propertiesLoading || requestsLoading,
  };
}
```

- [ ] **Step 2: Migrate useAdminActions.ts**

Replace all mutation calls:
```ts
import {
  useUpdateUserRoleMutation,
  useDeletePropertyMutation,
  useDeleteBuildingMutation,
  useUpdateBookingStatusMutation,
} from "@/lib/api";
```

Remove all `import { ... } from "@/app/lib/api"` lines.

- [ ] **Step 3: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: migrate admin hooks to RTK Query"
```

---

### Task 19: Delete old api.ts and remove all remaining axios imports

**Files:**
- Delete: `src/app/lib/api.ts`
- Delete: `src/app/lib/` (if empty after deletion)
- Modify: `src/store/slices/shortlistSlice.ts` (remove axios import)
- Modify: `src/app/app/properties/page.tsx` (remove types-only import)

- [ ] **Step 1: Find any remaining imports of the old api.ts**

```bash
grep -rn 'from.*app/lib/api\|from.*"../lib/api"\|from.*"../../lib/api"\|from.*"../../../lib/api"' src --include="*.ts" --include="*.tsx"
```

For any remaining results, trace what they import and either:
- Replace with RTK Query hook
- Move pure type imports to `@/types`

- [ ] **Step 2: Check shortlistSlice.ts**

The old `src/features/shortlist/model/shortlistSlice.ts` imported from `@/app/lib/api`. It's now at `src/store/slices/shortlistSlice.ts`. Verify it no longer imports from the old api.ts (the hook migration in Task 16 should have handled this). If it still does, the thunks inside it need to use the RTK Query hooks pattern or be removed (since RTK Query mutations replace Redux thunks for API calls).

- [ ] **Step 3: Delete the old api.ts**

```bash
rm src/app/lib/api.ts
rmdir src/app/lib 2>/dev/null || true
```

- [ ] **Step 4: Run type-check**

```bash
npm run type-check
```

Expected: zero errors. If there are missing-module errors, trace them to remaining usages and fix.

- [ ] **Step 5: Delete old apiSlice.ts (replaced by src/lib/api.ts)**

```bash
rm src/store/slices/apiSlice.ts
```

- [ ] **Step 6: Run type-check and build**

```bash
npm run type-check && npm run build 2>&1 | tail -30
```

Expected: zero type errors, successful build.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: delete old axios api.ts and apiSlice — RTK Query is now the only API layer"
```

---

## Phase 4: Component Restructure + Performance

---

### Task 20: Break EditPropertyModal into section components

**Context:** `src/app/components/EditPropertyModal.tsx` is 3034 lines. Break it into focused section components following the existing `AddPropertyModal/components/` pattern. The modal orchestrates; sections own their logic.

**Files:**
- Create: `src/app/app/properties/_components/edit/EditPropertyModal.tsx` (orchestrator, ~150 lines)
- Create: `src/app/app/properties/_components/edit/sections/BasicInfoSection.tsx`
- Create: `src/app/app/properties/_components/edit/sections/LocationSection.tsx`
- Create: `src/app/app/properties/_components/edit/sections/PropertyDetailsSection.tsx`
- Create: `src/app/app/properties/_components/edit/sections/AmenitiesSection.tsx`
- Create: `src/app/app/properties/_components/edit/sections/MediaSection.tsx`
- Create: `src/app/app/properties/_components/edit/sections/ConciergePetsSmokingSection.tsx`
- Delete: `src/app/components/EditPropertyModal.tsx`

- [ ] **Step 1: Read the existing EditPropertyModal.tsx to identify sections**

```bash
grep -n "// Section\|{/\* Section\|<section\|// ---\|const.*Section\|function.*Section" src/app/components/EditPropertyModal.tsx | head -30
```

Map out which lines belong to which logical section.

- [ ] **Step 2: Create the directory**

```bash
mkdir -p src/app/app/properties/_components/edit/sections
```

- [ ] **Step 3: Extract BasicInfoSection**

Create `src/app/app/properties/_components/edit/sections/BasicInfoSection.tsx`. It receives form context via `useFormContext()` (react-hook-form) — no prop drilling for every field.

```tsx
"use client";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input/Input";
import { Textarea } from "@/components/ui/Textarea/Textarea";

export function BasicInfoSection() {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>
      <Input
        label="Title"
        {...register("title", { required: "Title is required" })}
        error={errors.title?.message as string}
      />
      <Textarea
        label="Description"
        {...register("description")}
        error={errors.description?.message as string}
      />
      {/* Add all remaining basic-info fields extracted from EditPropertyModal */}
    </div>
  );
}
```

Extract the relevant JSX from the original file for each field in the basic info section.

- [ ] **Step 4: Extract remaining sections**

Apply the same pattern for each section. Each file:
- Uses `useFormContext()` — no individual field props
- Has one responsibility
- Is under ~200 lines

Sections to create (follow the same `useFormContext` pattern):
- `LocationSection.tsx` — address, city, coordinates fields
- `PropertyDetailsSection.tsx` — price, bedrooms, bathrooms, square meters, availability date
- `AmenitiesSection.tsx` — amenities checkbox list
- `MediaSection.tsx` — photo upload, using `useUpdatePropertyMutation` from `@/lib/api`
- `ConciergePetsSmokingSection.tsx` — concierge, pets, smoking policy toggles

- [ ] **Step 5: Create the orchestrator EditPropertyModal.tsx**

```tsx
"use client";
import { useForm, FormProvider } from "react-hook-form";
import { useUpdatePropertyMutation } from "@/lib/api";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { LocationSection } from "./sections/LocationSection";
import { PropertyDetailsSection } from "./sections/PropertyDetailsSection";
import { AmenitiesSection } from "./sections/AmenitiesSection";
import { MediaSection } from "./sections/MediaSection";
import { ConciergePetsSmokingSection } from "./sections/ConciergePetsSmokingSection";

interface EditPropertyModalProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function EditPropertyModal({ property, isOpen, onClose, onSaved }: EditPropertyModalProps) {
  const methods = useForm({ defaultValues: property });
  const [updateProperty, { isLoading }] = useUpdatePropertyMutation();

  const onSubmit = async (data: any) => {
    await updateProperty({ id: property.id, data }).unwrap();
    onSaved?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <BasicInfoSection />
            <LocationSection />
            <PropertyDetailsSection />
            <AmenitiesSection />
            <ConciergePetsSmokingSection />
            <MediaSection propertyId={property.id} />
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-6 py-2 rounded-full border border-gray-300">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-full bg-black text-white disabled:opacity-50">
                {isLoading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update all imports of EditPropertyModal**

```bash
grep -rn 'EditPropertyModal' src --include="*.tsx" --include="*.ts"
```

Update to `@/app/app/properties/_components/edit/EditPropertyModal`.

- [ ] **Step 7: Delete the original**

```bash
rm src/app/components/EditPropertyModal.tsx
```

- [ ] **Step 8: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: decompose EditPropertyModal (3034 lines) into focused section components"
```

---

### Task 21: Break EditBuildingModal and AddBuildingModal into sections

**Context:** Same pattern as Task 20. `EditBuildingModal.tsx` (2431 lines) and `AddBuildingModal.tsx` (2170 lines).

**Files:**
- Create: `src/app/app/buildings/_components/edit/EditBuildingModal.tsx` + section files
- Create: `src/app/app/buildings/_components/add/AddBuildingModal.tsx` + section files
- Delete: `src/app/components/EditBuildingModal.tsx`
- Delete: `src/app/components/AddBuildingModal.tsx`

- [ ] **Step 1: Identify sections in EditBuildingModal.tsx**

```bash
grep -n "// Section\|{/\* Section\|// ---\|const.*Section" src/app/components/EditBuildingModal.tsx | head -20
```

Typical building sections: BasicInfo, Location, Amenities, Media (photos/video/logo), Documents, Settings.

- [ ] **Step 2: Create directories**

```bash
mkdir -p src/app/app/buildings/_components/edit/sections
mkdir -p src/app/app/buildings/_components/add/sections
```

- [ ] **Step 3: Apply the same FormProvider + useFormContext pattern**

Follow the exact same structure as Task 20:
- Orchestrator uses `useForm` + `<FormProvider>`
- Each section uses `useFormContext()` — no prop drilling
- File uploads use `useUpdateBuildingMutation` / `useUploadBuildingPhotosMutation` from `@/lib/api`
- Each section file stays under ~200 lines

- [ ] **Step 4: Delete originals and update imports**

```bash
rm src/app/components/EditBuildingModal.tsx
rm src/app/components/AddBuildingModal.tsx
grep -rn 'EditBuildingModal\|AddBuildingModal' src --include="*.tsx"
# Update each reference to the new path
```

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: decompose EditBuildingModal (2431 lines) and AddBuildingModal (2170 lines) into sections"
```

---

### Task 22: Convert static pages to Server Components

**Context:** Every page currently has `"use client"` — forfeiting RSC benefits. Pages that are primarily static (fetch data once, render HTML) should be Server Components. Interactive parts become small client islands.

**Target pages:** `privacy/page.tsx`, `terms/page.tsx` (pure static), `buildings/[id]/page.tsx`, `operators/[id]/page.tsx` (mostly static with small client islands).

**Files:**
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/terms/page.tsx` (if exists)
- Modify: `src/app/app/buildings/[id]/page.tsx`
- Modify: `src/app/app/operators/[id]/page.tsx`

- [ ] **Step 1: Convert privacy/page.tsx to Server Component**

Remove `"use client"` from the top of the file. Verify it has no client-side hooks (`useState`, `useEffect`, `useRouter`, `useSelector`). If it does, extract the interactive part into a `_components/InteractivePart.tsx` with `"use client"`.

The pattern:
```tsx
// src/app/privacy/page.tsx — NO "use client" directive
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      {/* static content */}
    </main>
  );
}
```

- [ ] **Step 2: Convert buildings/[id]/page.tsx**

Identify which parts need client state:
```bash
grep -n 'useState\|useEffect\|useRouter\|useSelector\|useDispatch' src/app/app/buildings/\[id\]/page.tsx | head -20
```

Extract interactive parts (gallery, booking button, map) into `_components/` files with `"use client"`. Make the page itself a Server Component that passes fetched data as props.

Pattern:
```tsx
// page.tsx — Server Component
export default async function BuildingPage({ params }: { params: { id: string } }) {
  // Direct fetch — no useEffect needed
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/public/${params.id}`, {
    next: { revalidate: 60 } // cache for 60s
  });
  const building = await res.json();
  
  return (
    <>
      <BuildingDetails building={building} />          {/* Server Component */}
      <BuildingGallery photos={building.photos} />     {/* "use client" */}
      <BookingPanel buildingId={building.id} />        {/* "use client" */}
    </>
  );
}
```

- [ ] **Step 3: Convert operators/[id]/page.tsx**

Same pattern. Extract the interactive booking/contact section into a client island.

- [ ] **Step 4: Run build to verify SSR works**

```bash
npm run build 2>&1 | grep -E "Error|error|✓|○|●" | head -30
```

Check that converted pages show as `○ (Static)` or `● (SSG)` in the build output, not `λ (Dynamic)`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "perf: convert static pages to Server Components (privacy, buildings/[id], operators/[id])"
```

---

### Task 23: Replace raw img tags with Next.js Image

**Context:** 4 files use raw `<img>` tags, missing lazy loading, WebP conversion, and responsive sizes.

**Files:**
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/app/properties/[id]/page.tsx`
- Modify: `src/app/components/AuthModal.tsx`
- Modify: `src/components/property/PropertyContent.tsx`

- [ ] **Step 1: Fix each file**

For every raw `<img>` tag, replace with Next.js `<Image>`:

```tsx
// Before:
import Image from "next/image"; // already imported in most files
<img src="/hero-bg.png" alt="Hero" className="w-full h-64 object-cover" />

// After:
<Image
  src="/hero-bg.png"
  alt="Hero"
  width={1200}
  height={256}
  className="w-full h-64 object-cover"
  priority={false}
/>
```

For dynamic URLs (S3 images), ensure the domain is in `next.config.ts`:
```ts
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
};
```

- [ ] **Step 2: Run type-check and build**

```bash
npm run type-check && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "perf: replace raw img tags with Next.js Image for lazy loading and WebP"
```

---

### Task 24: Final cleanup and verification

- [ ] **Step 1: Remove any remaining dead components from src/app/components/**

After all the moves above, `src/app/components/` should only contain components that are genuinely shared across multiple routes and haven't been moved yet. List what remains:
```bash
ls src/app/components/
```

For each remaining file, decide: move to `src/components/` (shared) or to the route that uses it (`_components/`). Delete any that are no longer imported anywhere.

- [ ] **Step 2: Verify no file exceeds ~500 lines (excluding generated)**

```bash
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | grep -v node_modules | head -20
```

Any file over 500 lines that isn't a large constants/mapping file should be reviewed for further decomposition.

- [ ] **Step 3: Final type-check**

```bash
npm run type-check
```

Expected: zero errors.

- [ ] **Step 4: Final build**

```bash
npm run build
```

Expected: successful build. Note the build output — Server Components should appear as `○` (static) and data-heavy pages as `λ` (dynamic SSR). 

- [ ] **Step 5: Verify success criteria from the spec**

Check each item:
```bash
# No imports from deleted paths
grep -r "app/lib/api\|/features/\|/entities/\|/widgets/\|/shared/" src --include="*.ts" --include="*.tsx" | grep -v node_modules

# primereact removed
grep -r "primereact" src --include="*.ts" --include="*.tsx" | grep -v node_modules

# No raw img tags
grep -rn '<img ' src --include="*.tsx" | grep -v node_modules
```

Expected: all greps return empty output.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup, verify all refactoring success criteria pass"
```

---

## Summary of Commits by Phase

| Phase | Commits |
|---|---|
| Phase 1: Purge | 4 commits |
| Phase 2: Consolidate | 10 commits |
| Phase 3: API Migration | 5 commits |
| Phase 4: Restructure + Performance | 5 commits |

**Total: ~24 atomic commits**, each independently reviewable and leaving the codebase in a working state.
