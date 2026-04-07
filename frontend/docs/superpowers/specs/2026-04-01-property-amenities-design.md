# Property Amenities Step — Design Spec

**Date:** 2026-04-01  
**Feature:** New `property_amenities` preferences wizard step + matching category

---

## Overview

Add a new wizard step ("What's Included") inserted before the existing Amenities step (step 7 → 8). This captures apartment-level features (access, tech, storage, bathroom, kitchen) separately from building-level amenities. The field is added to both `preferences` and `properties`, and is included in match scoring as its own category.

---

## 1. Database & Backend

### New columns

Both tables get an identical JSONB column:

```
preferences.property_amenities  string[]  nullable  default []
properties.property_amenities   string[]  nullable  default []
```

Pattern matches the existing `amenities` column definition.

### Migration

One new TypeORM migration file adding both columns.

### Entity changes

**`preferences.entity.ts`** and **`property.entity.ts`** each get:

```typescript
@Column({ type: 'jsonb', nullable: true, default: [] })
property_amenities?: string[];
```

### DTO changes

**`create-property.dto.ts`** (and the preferences DTO) get:

```typescript
@ApiProperty({ description: 'Apartment-level features', example: ['Dishwasher', 'Bathtub'], type: [String], required: false })
@IsOptional()
@IsArray()
@IsString({ each: true })
property_amenities?: string[];
```

### Matching

- Add `propertyAmenities: 5` to `CategoryWeights` interface and `DEFAULT_WEIGHTS` in `matching.interfaces.ts` (existing weights unchanged)
- Add `private matchPropertyAmenities(property, preferences, maxScore): CategoryMatchResult` to `matching-calculation.service.ts` — same proportional overlap logic as `matchAmenities()`
- Call it in `calculateMatch()`: `categories.push(this.matchPropertyAmenities(property, preferences, weights.propertyAmenities))`

---

## 2. Frontend Constants

New file: **`src/shared/constants/property-amenities.ts`**

Five groups, each with `titleKey`, `values` (English strings stored in DB), and `labelKeys` (Localazy keys for display via `t()`):

| Group | Title key | Values |
|-------|-----------|--------|
| Access | `listing.features.access.title` | Floor level, Secure entry system, Bin storage area |
| Tech | `listing.features.tech.title` | Fibre broadband, USB / USB-C charging points, Smart thermostat |
| Storage | `listing.features.storage.title` | Built-in storage, Wardrobe space, Utility storage |
| Bathroom | `listing.features.bathroom.title` | Rainfall shower, Bathtub, Heated towel rail, Ventilation (window / extractor fan) |
| Kitchen | `listing.features.kitchen.title` | Water pressure, Filtered drinking water tap, Soft-close drawers and cabinets, Extractor fan, Bin storage / recycling setup, Microwave, Coffee machine, Washing machine, Dishwasher, Electric hob, Gas hob |

> ⚠️ **Localazy action required:** `listing.features.kitchen.microwave` is missing from Localazy. Add it with value "Microwave" before release. Do NOT edit `en.json` — it is managed by the Localazy sync script.

Admin constant: **`PROPERTY_AMENITIES_BY_CATEGORY`** added to `src/shared/constants/admin-form-options.ts`, built from `PROPERTY_AMENITIES_GROUPS` so values stay in sync.

---

## 3. Frontend Preferences Wizard

### New step component

**`src/app/components/preferences/steps/PropertyAmenitiesStep.tsx`**

- Same structure as `AmenitiesStep.tsx`: `StepWrapper` → `StepContainer` → 5 sections of `SelectionButton` grids
- Iterates over `PROPERTY_AMENITIES_GROUPS`
- Page title via `t("appartment.included.title")` → "What's Included"
- Form field: `property_amenities_preferences`

### Wizard step numbering

`NewPreferencesPage.tsx` switch statement:

| Step | Component |
|------|-----------|
| 1–6 | Unchanged |
| **7 (new)** | **`PropertyAmenitiesStep`** |
| 8 (was 7) | `AmenitiesStep` |
| 9–12 (were 8–11) | Shifted up by 1 |

`TOTAL_STEPS_NEW`: 11 → 12

### Translation keys

`wizardTranslationKeys.ts`: add new `step7` entry with title `appartment.included.title`; shift old step7–11 keys to step8–12.

### Data transform

In `src/entities/preferences/model/preferences.ts`:

- `PreferencesFormData` type: add `property_amenities_preferences?: string[]`
- Default form value: `property_amenities_preferences: []`
- `transformFormDataForApi()`: `property_amenities_preferences` → `property_amenities`
- `transformApiDataForForm()`: `property_amenities` → `property_amenities_preferences`

---

## 4. Admin Panel

Both `AddPropertyModal` and `EditPropertyModal` get a `property_amenities` field using the existing `AmenitiesSection` dropdown+chip pattern, populated from `PROPERTY_AMENITIES_BY_CATEGORY`. Section appears alongside the existing amenities section.

---

## Out of Scope

- Displaying `property_amenities` on the public property card or detail page (not requested)
- Changing any translation file (`en.json` is Localazy-managed)

---

## Files to Change

| File | Change |
|------|--------|
| `backend/database/migrations/[timestamp]-add-property-amenities.ts` | New migration |
| `backend/src/entities/preferences.entity.ts` | Add column |
| `backend/src/entities/property.entity.ts` | Add column |
| `backend/src/modules/property/dto/create-property.dto.ts` | Add field |
| `backend/src/modules/matching/interfaces/matching.interfaces.ts` | Add weight |
| `backend/src/modules/matching/services/matching-calculation.service.ts` | Add method + call |
| `frontend/src/shared/constants/property-amenities.ts` | New file |
| `frontend/src/shared/constants/admin-form-options.ts` | Add category constant |
| `frontend/src/app/components/preferences/steps/PropertyAmenitiesStep.tsx` | New file |
| `frontend/src/app/components/preferences/NewPreferencesPage.tsx` | Insert step 7, shift steps |
| `frontend/src/app/types/preferences.ts` | Add form field type |
| `frontend/src/entities/preferences/model/preferences.ts` | Transform functions + default |
| `frontend/src/app/lib/translationsKeys/wizardTranslationKeys.ts` | Add + shift step keys |
| `frontend/src/app/components/AddPropertyModal/components/AmenitiesSection.tsx` | Add property_amenities |
| `frontend/src/app/components/EditPropertyModal.tsx` | Add property_amenities |
