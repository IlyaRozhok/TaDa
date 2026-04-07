# Property Amenities Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `property_amenities` field to both `properties` and `preferences` tables, expose it in the preferences wizard as a new step 7 ("What's Included"), include it in admin property forms, and score it as a separate matching category.

**Architecture:** Backend adds column + DTO + matching method; frontend adds a constants file, a new wizard step component, updates wizard routing + transforms, and adds the field to both admin modals. The pattern mirrors the existing `amenities` field exactly.

**Tech Stack:** NestJS + TypeORM + PostgreSQL (backend); Next.js App Router + Redux RTK + TypeScript (frontend); Tailwind CSS; Localazy for i18n (translations file is read-only).

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `backend/database/migrations/[ts]-add-property-amenities.ts` | Create | DB migration adding column to both tables |
| `backend/src/entities/preferences.entity.ts` | Modify | Add `property_amenities` column |
| `backend/src/entities/property.entity.ts` | Modify | Add `property_amenities` column |
| `backend/src/modules/property/dto/create-property.dto.ts` | Modify | Add `property_amenities` field |
| `backend/src/modules/matching/interfaces/matching.interfaces.ts` | Modify | Add `propertyAmenities` weight |
| `backend/src/modules/matching/services/matching-calculation.service.ts` | Modify | Add `matchPropertyAmenities()` + call it |
| `frontend/src/shared/constants/property-amenities.ts` | Create | Groups of values + label keys |
| `frontend/src/shared/constants/admin-form-options.ts` | Modify | Add `PROPERTY_AMENITIES_BY_CATEGORY` |
| `frontend/src/app/types/preferences.ts` | Modify | Add `property_amenities_preferences` to `PreferencesFormData` |
| `frontend/src/entities/preferences/model/preferences.ts` | Modify | Transform + default value |
| `frontend/src/app/lib/translationsKeys/wizardTranslationKeys.ts` | Modify | Add `step7` (new), rename old step7→step8 … step11→step12 |
| `frontend/src/app/components/preferences/steps/PropertyAmenitiesStep.tsx` | Create | New wizard step component |
| `frontend/src/app/components/preferences/NewPreferencesPage.tsx` | Modify | Insert step 7, shift cases, bump TOTAL_STEPS |
| `frontend/src/app/components/AddPropertyModal/types.ts` | Modify | Add `property_amenities` to `PropertyFormData` |
| `frontend/src/app/components/AddPropertyModal/hooks/usePropertyForm.ts` | Modify | Add default value |
| `frontend/src/app/components/AddPropertyModal/components/AmenitiesSection.tsx` | Modify | Add `property_amenities` dropdown section |
| `frontend/src/app/components/EditPropertyModal.tsx` | Modify | Add `property_amenities` dropdown + toggle handler |

---

## Task 1: DB Migration

**Files:**
- Create: `backend/database/migrations/1764200000000-add-property-amenities.ts`

- [ ] **Step 1: Create the migration file**

```typescript
// backend/database/migrations/1764200000000-add-property-amenities.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyAmenities1764200000000 implements MigrationInterface {
  name = "AddPropertyAmenities1764200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "property_amenities" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD COLUMN IF NOT EXISTS "property_amenities" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "property_amenities"`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN IF EXISTS "property_amenities"`,
    );
  }
}
```

- [ ] **Step 2: Run the migration**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/backend
npm run migration:run
```

Expected: Migration `AddPropertyAmenities1764200000000` executed successfully.

- [ ] **Step 3: Verify columns exist**

```bash
# Connect to your local DB and run:
psql -c "\d properties" | grep property_amenities
psql -c "\d preferences" | grep property_amenities
```

Expected: Both show `property_amenities | jsonb`.

- [ ] **Step 4: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod
git add backend/database/migrations/1764200000000-add-property-amenities.ts
git commit -m "feat: add property_amenities migration for properties and preferences"
```

---

## Task 2: Backend Entities

**Files:**
- Modify: `backend/src/entities/preferences.entity.ts` (after the existing `amenities` column ~line 303)
- Modify: `backend/src/entities/property.entity.ts` (after the existing `amenities` column)

- [ ] **Step 1: Add column to `preferences.entity.ts`**

Find the block:
```typescript
  // ==================== STEP 7: AMENITIES ====================

  @ApiProperty({
    description: "Preferred amenities (matches Property.amenities)",
    example: ["Gym", "Co-working", "Parking"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  amenities?: string[];

  // ==================== STEP 8: HOBBIES ====================
```

Insert after `amenities?: string[];` and before `// ==================== STEP 8`:

```typescript
  // ==================== STEP 7b: PROPERTY AMENITIES (apartment-level features) ====================

  @ApiProperty({
    description: "Preferred apartment-level features (kitchen, bathroom, storage, etc.)",
    example: ["Dishwasher", "Rainfall shower", "Fibre broadband"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  property_amenities?: string[];
```

- [ ] **Step 2: Add column to `property.entity.ts`**

Find the existing `amenities` column in `property.entity.ts` (grep for `amenities?: string[]`) and insert after it:

```typescript
  @ApiProperty({
    description: "Apartment-level features (kitchen, bathroom, storage, tech, access)",
    example: ["Dishwasher", "Rainfall shower", "Fibre broadband"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  property_amenities?: string[];
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/entities/preferences.entity.ts backend/src/entities/property.entity.ts
git commit -m "feat: add property_amenities column to preferences and property entities"
```

---

## Task 3: Backend DTO

**Files:**
- Modify: `backend/src/modules/property/dto/create-property.dto.ts` (after the existing `amenities` field ~line 186)

- [ ] **Step 1: Add field to DTO**

Find the existing `amenities` field block ending with `amenities?: string[];` and add after it:

```typescript
  @ApiProperty({
    description: "Apartment-level features (kitchen, bathroom, storage, tech, access)",
    example: ["Dishwasher", "Rainfall shower", "Fibre broadband"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  property_amenities?: string[];
```

- [ ] **Step 2: Check for an `UpdatePropertyDto` or preferences DTO**

```bash
grep -r "property_amenities\|UpdatePropertyDto\|CreatePreferencesDto" \
  /Users/irozhok/Desktop/Tada/tada-prod/backend/src/modules --include="*.ts" -l
```

If `UpdatePropertyDto` extends `PartialType(CreatePropertyDto)` no further changes are needed. If it has its own fields, add `property_amenities` there too. Check similarly for any preferences DTO and add the field if it declares `amenities` explicitly.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/property/dto/create-property.dto.ts
git commit -m "feat: add property_amenities to property DTO"
```

---

## Task 4: Matching — Weight + Method

**Files:**
- Modify: `backend/src/modules/matching/interfaces/matching.interfaces.ts`
- Modify: `backend/src/modules/matching/services/matching-calculation.service.ts`

- [ ] **Step 1: Add weight to interface and defaults**

In `matching.interfaces.ts`, add to `CategoryWeights` interface after `amenities: number;`:

```typescript
  propertyAmenities: number; // Apartment-level features match
```

Add to `DEFAULT_WEIGHTS` after `amenities: 8,`:

```typescript
  propertyAmenities: 5, // Apartment-level features (kitchen, bathroom, storage, tech, access)
```

- [ ] **Step 2: Add `matchPropertyAmenities()` method**

In `matching-calculation.service.ts`, add the following method after the closing `}` of `matchAmenities()` (after line 1090):

```typescript
  /**
   * Property amenities matching
   * Matches apartment-level features (kitchen, bathroom, storage, tech, access)
   */
  private matchPropertyAmenities(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefFeatures = preferences.property_amenities || [];
    const propertyFeatures = property.property_amenities || [];

    if (!prefFeatures.length) {
      return {
        category: "propertyAmenities",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No apartment feature preferences set",
        details: propertyFeatures.length
          ? `Available: ${propertyFeatures.slice(0, 3).join(", ")}${propertyFeatures.length > 3 ? "..." : ""}`
          : "No features listed",
        hasPreference: false,
      };
    }

    const normalizedPref = prefFeatures.map((f) => f.toLowerCase());
    const normalizedProp = propertyFeatures.map((f) => f.toLowerCase());
    const matchedCount = normalizedPref.filter((f) =>
      normalizedProp.includes(f),
    ).length;
    const matchRatio = matchedCount / prefFeatures.length;

    const details = `${matchedCount} of ${prefFeatures.length} features available`;

    if (matchRatio === 1) {
      return {
        category: "propertyAmenities",
        match: true,
        score: maxScore,
        maxScore,
        reason: "All apartment features available",
        details,
        hasPreference: true,
      };
    }

    if (matchRatio >= 0.6) {
      return {
        category: "propertyAmenities",
        match: true,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Most apartment features available",
        details,
        hasPreference: true,
      };
    }

    if (matchRatio > 0) {
      return {
        category: "propertyAmenities",
        match: false,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Some apartment features available",
        details,
        hasPreference: true,
      };
    }

    return {
      category: "propertyAmenities",
      match: false,
      score: 0,
      maxScore,
      reason: "Preferred apartment features not available",
      details: `Missing ${prefFeatures.length} requested features`,
      hasPreference: true,
    };
  }
```

- [ ] **Step 3: Call the method in `calculateMatch()`**

In `calculateMatch()`, after the line:
```typescript
    // 17. Bills matching
    categories.push(this.matchBills(property, preferences, weights.bills));
```

Add:
```typescript
    // 18. Property amenities matching (apartment-level features)
    categories.push(
      this.matchPropertyAmenities(property, preferences, weights.propertyAmenities),
    );
```

- [ ] **Step 4: Commit**

```bash
git add \
  backend/src/modules/matching/interfaces/matching.interfaces.ts \
  backend/src/modules/matching/services/matching-calculation.service.ts
git commit -m "feat: add propertyAmenities matching category with proportional scoring"
```

---

## Task 5: Frontend Constants

**Files:**
- Create: `frontend/src/shared/constants/property-amenities.ts`
- Modify: `frontend/src/shared/constants/admin-form-options.ts`

- [ ] **Step 1: Create the constants file**

```typescript
// frontend/src/shared/constants/property-amenities.ts

export interface PropertyAmenitiesGroup {
  titleKey: string;
  values: string[];
  labelKeys: string[];
}

export const PROPERTY_AMENITIES_GROUPS: PropertyAmenitiesGroup[] = [
  {
    titleKey: "listing.features.access.title",
    values: ["Floor level", "Secure entry system", "Bin storage area"],
    labelKeys: [
      "listing.features.access.floorLevel",
      "listing.features.access.secureEntry",
      "listing.features.access.binArea",
    ],
  },
  {
    titleKey: "listing.features.tech.title",
    values: ["Fibre broadband", "USB / USB-C charging points", "Smart thermostat"],
    labelKeys: [
      "listing.features.tech.fibre",
      "listing.features.tech.usb",
      "listing.features.tech.thermostat",
    ],
  },
  {
    titleKey: "listing.features.storage.title",
    values: ["Built-in storage", "Wardrobe space", "Utility storage"],
    labelKeys: [
      "listing.features.storage.builtIn",
      "listing.features.storage.wardrobe",
      "listing.features.storage.utility",
    ],
  },
  {
    titleKey: "listing.features.bathroom.title",
    values: [
      "Rainfall shower",
      "Bathtub",
      "Heated towel rail",
      "Ventilation (window / extractor fan)",
    ],
    labelKeys: [
      "listing.features.bathroom.rainfallShower",
      "listing.features.bathroom.bathtub",
      "listing.features.bathroom.towelRail",
      "listing.features.bathroom.ventilation",
    ],
  },
  {
    titleKey: "listing.features.kitchen.title",
    values: [
      "Water pressure",
      "Filtered drinking water tap",
      "Soft-close drawers and cabinets",
      "Extractor fan",
      "Bin storage / recycling setup",
      "Microwave",
      "Coffee machine",
      "Washing machine",
      "Dishwasher",
      "Electric hob",
      "Gas hob",
    ],
    labelKeys: [
      "listing.features.kitchen.waterPressure",
      "listing.features.kitchen.filteredTap",
      "listing.features.kitchen.softClose",
      "listing.features.kitchen.extractor",
      "listing.features.kitchen.binSetup",
      "listing.features.kitchen.microwave",
      "listing.features.kitchen.coffeeMachine",
      "listing.features.kitchen.washingMachine",
      "listing.features.kitchen.dishwasher",
      "listing.features.kitchen.electricHob",
      "listing.features.kitchen.gasHob",
    ],
  },
];

/** Flat list of all property amenity values (English strings stored in DB). */
export const PROPERTY_AMENITIES_VALUES: string[] = PROPERTY_AMENITIES_GROUPS.flatMap(
  (g) => g.values,
);
```

- [ ] **Step 2: Add `PROPERTY_AMENITIES_BY_CATEGORY` to `admin-form-options.ts`**

At the top of `admin-form-options.ts`, add the import:
```typescript
import { PROPERTY_AMENITIES_GROUPS } from "./property-amenities";
```

After the `AMENITIES_OPTIONS` export, add:
```typescript
// ==================== PROPERTY AMENITIES (apartment-level features) ====================
export const PROPERTY_AMENITIES_BY_CATEGORY = PROPERTY_AMENITIES_GROUPS.map((g) => ({
  titleKey: g.titleKey,
  values: g.values,
}));
```

- [ ] **Step 3: Commit**

```bash
git add \
  frontend/src/shared/constants/property-amenities.ts \
  frontend/src/shared/constants/admin-form-options.ts
git commit -m "feat: add PROPERTY_AMENITIES_GROUPS constants and admin category list"
```

---

## Task 6: Frontend Types + Transform

**Files:**
- Modify: `frontend/src/app/types/preferences.ts` (around line 110 — after `amenities_preferences`)
- Modify: `frontend/src/entities/preferences/model/preferences.ts` (transform functions + default)

- [ ] **Step 1: Add type field**

In `frontend/src/app/types/preferences.ts`, find:
```typescript
  amenities_preferences?: string[]; // UI alias for amenities
```
Add after it:
```typescript
  property_amenities_preferences?: string[]; // UI alias for property_amenities
```

- [ ] **Step 2: Add default value in `transformApiDataForForm()`**

In `frontend/src/entities/preferences/model/preferences.ts`, find the `formData` object inside `transformApiDataForForm()`:
```typescript
    amenities_preferences: Array.isArray(apiData.amenities) ? apiData.amenities : [],
    additional_preferences: [],
```
Add after `amenities_preferences`:
```typescript
    property_amenities_preferences: Array.isArray(apiData.property_amenities)
      ? apiData.property_amenities
      : [],
```

- [ ] **Step 3: Add mapping in `transformFormDataForApi()`**

In the same file, find:
```typescript
  // Amenities: Step 7 stores admin names (Gym, Co-working, ...) – pass through to API
  if (formData.amenities_preferences !== undefined) {
    apiData.amenities = formData.amenities_preferences;
  }
```
Add after it:
```typescript
  if (formData.property_amenities_preferences !== undefined) {
    apiData.property_amenities = formData.property_amenities_preferences;
  }
```

- [ ] **Step 4: Commit**

```bash
git add \
  frontend/src/app/types/preferences.ts \
  frontend/src/entities/preferences/model/preferences.ts
git commit -m "feat: add property_amenities_preferences form field and transform mappings"
```

---

## Task 7: Wizard Translation Keys

**Files:**
- Modify: `frontend/src/app/lib/translationsKeys/wizardTranslationKeys.ts`

The current steps 7–11 must shift to 8–12. The new step 7 uses Localazy keys directly (no wizard-level keys needed — the step iterates `PROPERTY_AMENITIES_GROUPS` which carries its own `titleKey` and `labelKeys`).

- [ ] **Step 1: Rename existing `step7` → `step8`, `step8` → `step9`, … `step11` → `step12`**

In `wizardTranslationKeys.ts`:

Replace the block starting `step7: {` (lines 138–180) with the same content but under the key `step8`:
```typescript
  step8: {
    title: "wizard.step7.title",
    subtitle: "wizard.step7.subtitle",
    des: {
      text1: "wizard.step7.des.text1",
      text2: "wizard.step7.des.text2",
      text3: "wizard.step7.des.text3",
      text4: "wizard.step7.des.text4",
      text5: "wizard.step7.des.text5",
      text6: "wizard.step7.des.text6",
      text7: "wizard.step7.des.text7",
      text8: "wizard.step7.des.text8",
      text9: "wizard.step7.des.text9",
      text10: "wizard.step7.des.text10",
    },
    section1Options: [
      "amenities.name1",
      "amenities.name2",
      "amenities.name3",
      "amenities.name4",
      "amenities.name5",
      "amenities.name6",
      "amenities.name7",
      "amenities.name8",
      "amenities.name9",
      "amenities.name10",
    ],
    section2Options: [
      "amenities.name11",
      "amenities.name12",
      "amenities.name13",
      "amenities.name14",
      "amenities.name15",
      preferencesAmenityKeys.smokingArea,
    ],
    section3Options: [
      "amenities.name16",
      "amenities.name17",
      "amenities.name18",
    ],
    section4Options: ["amenities.name19", "amenities.name20"],
    section5Options: ["amenities.name21", "amenities.name22"],
  },
```

Rename `step8` → `step9` (keeping the same translation key strings `wizard.step8.*`):
```typescript
  step9: {
    title: "wizard.step8.title",
    subtitle: "wizard.step8.subtitle",
    des: { text1: "wizard.step8.des.text1" },
    field1: { title: "wizard.step8.field1.title" },
    field2: { title: "wizard.step8.field2.title" },
    field3: { title: "wizard.step8.field3.title" },
    occupationOptions: [
      "occupation.name1",
      "occupation.name2",
      "occupation.name3",
      "occupation.name4",
      "occupation.name5",
      "occupation.name6",
    ],
    familyStatusOptions: [
      "family.status.name1",
      "family.status.name2",
      "family.status.name3",
      "family.status.name4",
      "family.status.name5",
    ],
    childrenStatusOptions: [
      "children.status.name1",
      "children.status.name2",
      "children.status.name3",
      "children.status.name4",
    ],
  },
```

Rename `step9` → `step10` (keeping translation key strings `wizard.step9.*`):
```typescript
  step10: {
    title: "wizard.step9.title",
    subtitle: "wizard.step9.subtitle",
    des: {
      text1: "wizard.step9.des.text1",
      text2: "wizard.step9.des.text2",
      text3: "wizard.step9.des.text3",
      text4: "wizard.step9.des.text4",
      text5: "wizard.step9.des.text5",
      text6: "wizard.step9.des.text6",
    },
    section1Options: [
      "personal.growth.name1",
      "personal.growth.name2",
      "personal.growth.name3",
      "personal.growth.name4",
      "personal.growth.name5",
      "personal.growth.name6",
      "personal.growth.name7",
    ],
    section2Options: [
      "social.fun.name1",
      "social.fun.name2",
      "social.fun.name3",
      "social.fun.name4",
      "social.fun.name5",
      "social.fun.name6",
      "social.fun.name7",
      "social.fun.name8",
      "social.fun.name9",
    ],
    section3Options: [
      "sport.outdoors.name1",
      "sport.outdoors.name2",
      "sport.outdoors.name3",
      "sport.outdoors.name4",
      "sport.outdoors.name5",
      "sport.outdoors.name6",
      "sport.outdoors.name7",
      "sport.outdoors.name8",
      "sport.outdoors.name9",
    ],
    section4Options: [
      "wellbeing.lifestyle.name1",
      "wellbeing.lifestyle.name2",
      "wellbeing.lifestyle.name3",
      "wellbeing.lifestyle.name4",
      "wellbeing.lifestyle.name5",
      "wellbeing.lifestyle.name6",
      "wellbeing.lifestyle.name7",
      "wellbeing.lifestyle.name8",
      "wellbeing.lifestyle.name9",
      "wellbeing.lifestyle.name10",
    ],
    section5Options: [
      "creative.cultural.name1",
      "creative.cultural.name2",
      "creative.cultural.name3",
      "creative.cultural.name4",
      "creative.cultural.name5",
      "creative.cultural.name6",
      "creative.cultural.name7",
      "creative.cultural.name8",
      "creative.cultural.name9",
      "creative.cultural.name10",
    ],
  },
```

Rename `step10` → `step11` (keeping translation key strings `wizard.step10.*`):
```typescript
  step11: {
    title: "wizard.step10.title",
    subtitle: "wizard.step10.subtitle",
    des: {
      text1: "wizard.step10.des.text1",
      text2: "wizard.step10.des.text2",
    },
    livingEnvOptions: [
      "living.env.name1",
      "living.env.name2",
      "living.env.name3",
      "living.env.name4",
      "living.env.name5",
      "living.env.name6",
      "living.env.name7",
    ],
    smokerAnswerOptions: ["smoker.answer.name1", "smoker.answer.name2"],
  },
```

Rename `step11` → `step12` (keeping translation key strings `wizard.step11.*`):
```typescript
  step12: {
    title: "wizard.step11.title",
    subtitle: "wizard.step11.subtitle",
    des: {
      text1: "wizard.step11.des.text1",
      textField: "wizard.step11.des.text.field",
    },
  },
```

- [ ] **Step 2: Add new `step7` for the PropertyAmenities step**

Insert before `step8:` (the renamed old amenities step):

```typescript
  step7: {
    title: "appartment.included.title",
  },
```

> Note: The step component iterates `PROPERTY_AMENITIES_GROUPS` directly for section titles and option labels. Only the page title key is needed here.

- [ ] **Step 3: Check that `AmenitiesStep.tsx` still references `wizardKeys.step8` after the rename**

Open `frontend/src/app/components/preferences/steps/AmenitiesStep.tsx` and update the key reference from:
```typescript
  const k = wizardKeys.step7;
```
to:
```typescript
  const k = wizardKeys.step8;
```

- [ ] **Step 4: Check any other component referencing `wizardKeys.step8` through `wizardKeys.step11` and update to `step9`–`step12`**

```bash
grep -r "wizardKeys\.step[0-9]" \
  /Users/irozhok/Desktop/Tada/tada-prod/frontend/src --include="*.tsx" --include="*.ts"
```

Update each reference accordingly (step8→step9, step9→step10, step10→step11, step11→step12).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/lib/translationsKeys/wizardTranslationKeys.ts
git add frontend/src/app/components/preferences/steps/AmenitiesStep.tsx
git commit -m "feat: shift wizard step keys 7-11 to 8-12 to make room for new step 7"
```

---

## Task 8: New Wizard Step Component

**Files:**
- Create: `frontend/src/app/components/preferences/steps/PropertyAmenitiesStep.tsx`

- [ ] **Step 1: Create the component**

```typescript
// frontend/src/app/components/preferences/steps/PropertyAmenitiesStep.tsx
import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { PROPERTY_AMENITIES_GROUPS } from "@/shared/constants/property-amenities";

interface PropertyAmenitiesStepProps {
  formData: PreferencesFormData;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

export const PropertyAmenitiesStep: React.FC<PropertyAmenitiesStepProps> = ({
  formData,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <StepWrapper title={t(wizardKeys.step7.title)} description="">
      <StepContainer>
        {PROPERTY_AMENITIES_GROUPS.map((group) => (
          <React.Fragment key={group.titleKey}>
            <StepHeader title={t(group.titleKey)} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
              {group.values.map((value, i) => (
                <SelectionButton
                  key={value}
                  label={t(group.labelKeys[i])}
                  value={value}
                  isSelected={
                    formData.property_amenities_preferences?.includes(value) ?? false
                  }
                  onClick={() =>
                    onToggle("property_amenities_preferences", value)
                  }
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </StepContainer>
    </StepWrapper>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/components/preferences/steps/PropertyAmenitiesStep.tsx
git commit -m "feat: add PropertyAmenitiesStep wizard component"
```

---

## Task 9: Wire Step into Wizard

**Files:**
- Modify: `frontend/src/app/components/preferences/NewPreferencesPage.tsx`

- [ ] **Step 1: Import the new step**

Find the imports block at the top of `NewPreferencesPage.tsx` where the other step components are imported, and add:

```typescript
import { PropertyAmenitiesStep } from "./steps/PropertyAmenitiesStep";
```

- [ ] **Step 2: Update `TOTAL_STEPS`**

Find where `TOTAL_STEPS_NEW` is defined (or imported) and increase it from `11` to `12`. If it's defined in a constants file, update it there.

- [ ] **Step 3: Shift cases 7–11 and insert new case 7**

Find the `switch (step)` block and replace cases 7–11:

```typescript
      case 7:
        return <PropertyAmenitiesStep {...stepProps} />;
      case 8:
        return <AmenitiesStep {...stepProps} />;
      case 9:
        return (
          <LifestylePreferencesStep
            {...stepProps}
            onValidationChange={setIsCurrentStepValid}
          />
        );
      case 10:
        return <CompleteProfileStep {...stepProps} />;
      case 11:
        return <LivingEnvironmentStep {...stepProps} />;
      case 12:
        return (
          <AboutYouStep
            {...stepProps}
            onValidationChange={setIsCurrentStepValid}
          />
        );
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/components/preferences/NewPreferencesPage.tsx
git commit -m "feat: insert PropertyAmenitiesStep as step 7, shift remaining steps to 8-12"
```

---

## Task 10: Admin Panel — AddPropertyModal

**Files:**
- Modify: `frontend/src/app/components/AddPropertyModal/types.ts`
- Modify: `frontend/src/app/components/AddPropertyModal/hooks/usePropertyForm.ts`
- Modify: `frontend/src/app/components/AddPropertyModal/components/AmenitiesSection.tsx`

- [ ] **Step 1: Add `property_amenities` to `PropertyFormData`**

In `frontend/src/app/components/AddPropertyModal/types.ts`, find:
```typescript
  amenities: string[];
```
Add after it:
```typescript
  property_amenities: string[];
```

- [ ] **Step 2: Add default value in `usePropertyForm.ts`**

In `initialFormData`, find:
```typescript
  amenities: [],
```
Add after it:
```typescript
  property_amenities: [],
```

- [ ] **Step 3: Add property amenities section to `AmenitiesSection.tsx`**

Add the import at the top:
```typescript
import { PROPERTY_AMENITIES_BY_CATEGORY } from "../../../../shared/constants/admin-form-options";
```

Then add a second section below the existing amenities section. The full component becomes:

```typescript
import React from "react";
import { PropertyFormData } from "../types";
import { AMENITIES_BY_CATEGORY, PROPERTY_AMENITIES_BY_CATEGORY } from "../../../../shared/constants/admin-form-options";
import { translateAmenityStoredLabel } from "../../../../shared/constants/amenities";
import { useTranslation } from "../../../hooks/useTranslation";

interface AmenitiesSectionProps {
  formData: PropertyFormData;
  errors: Record<string, string>;
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onToggleDropdown: (dropdown: string) => void;
}

export const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
  formData,
  openDropdown,
  onFieldChange,
  onToggleDropdown,
}) => {
  const { t } = useTranslation();
  const isReadonly =
    formData.building_type !== "private_landlord" && !!formData.building_id;

  const toggleAmenity = (amenity: string) => {
    if (isReadonly) return;
    const current = formData.amenities || [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onFieldChange("amenities", next);
  };

  const togglePropertyAmenity = (amenity: string) => {
    const current = formData.property_amenities || [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onFieldChange("property_amenities", next);
  };

  return (
    <div className="space-y-4">
      {/* Building-level amenities */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Amenities{" "}
          {isReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </label>
        <div className="relative" data-dropdown>
          <div
            className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center ${
              isReadonly ? "cursor-default opacity-80" : "cursor-pointer"
            }`}
            onClick={() => !isReadonly && onToggleDropdown("amenities")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {(formData.amenities || []).length > 0 ? (
                (formData.amenities || []).map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                  >
                    {translateAmenityStoredLabel(amenity, t)}
                    {!isReadonly && (
                      <button
                        type="button"
                        className="ml-1 text-white/70 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFieldChange(
                            "amenities",
                            (formData.amenities || []).filter((a) => a !== amenity),
                          );
                        }}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-white/50">Select amenities...</span>
              )}
            </div>
            {!isReadonly && (
              <svg className="w-5 h-5 text-white/70 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
          {!isReadonly && openDropdown === "amenities" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {AMENITIES_BY_CATEGORY.map((category) => (
                <div key={category.title}>
                  <div className="px-4 py-2 text-xs font-semibold text-white/70 border-b border-white/10 sticky top-0 bg-gray-900/95">
                    {category.title}
                  </div>
                  {category.values.map((amenity) => (
                    <div
                      key={amenity}
                      className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                      onClick={() => toggleAmenity(amenity)}
                    >
                      <input
                        type="checkbox"
                        checked={(formData.amenities || []).includes(amenity)}
                        readOnly
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{translateAmenityStoredLabel(amenity, t)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apartment-level features */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          What's Included
        </label>
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center cursor-pointer"
            onClick={() => onToggleDropdown("property_amenities")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {(formData.property_amenities || []).length > 0 ? (
                (formData.property_amenities || []).map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                  >
                    {amenity}
                    <button
                      type="button"
                      className="ml-1 text-white/70 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFieldChange(
                          "property_amenities",
                          (formData.property_amenities || []).filter((a) => a !== amenity),
                        );
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-white/50">Select features...</span>
              )}
            </div>
            <svg className="w-5 h-5 text-white/70 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {openDropdown === "property_amenities" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {PROPERTY_AMENITIES_BY_CATEGORY.map((category) => (
                <div key={category.titleKey}>
                  <div className="px-4 py-2 text-xs font-semibold text-white/70 border-b border-white/10 sticky top-0 bg-gray-900/95">
                    {t(category.titleKey)}
                  </div>
                  {category.values.map((amenity) => (
                    <div
                      key={amenity}
                      className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                      onClick={() => togglePropertyAmenity(amenity)}
                    >
                      <input
                        type="checkbox"
                        checked={(formData.property_amenities || []).includes(amenity)}
                        readOnly
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Commit**

```bash
git add \
  frontend/src/app/components/AddPropertyModal/types.ts \
  frontend/src/app/components/AddPropertyModal/hooks/usePropertyForm.ts \
  frontend/src/app/components/AddPropertyModal/components/AmenitiesSection.tsx
git commit -m "feat: add property_amenities field to AddPropertyModal"
```

---

## Task 11: Admin Panel — EditPropertyModal

**Files:**
- Modify: `frontend/src/app/components/EditPropertyModal.tsx`

The `EditPropertyModal` handles its own form state inline (not using `AmenitiesSection` component — it renders amenities directly). You need to add `property_amenities` in four places.

- [ ] **Step 1: Add to initial form state**

Find (around line 144):
```typescript
    amenities: [] as string[],
```
Add after:
```typescript
    property_amenities: [] as string[],
```

Do the same for the two other initializer objects in the file (reset state at ~lines 492 and 516):
```typescript
    property_amenities: [],
```

- [ ] **Step 2: Add to the load-from-property block**

Find (around line 273):
```typescript
        amenities: parseArray(property.amenities),
```
Add after:
```typescript
        property_amenities: parseArray(property.property_amenities),
```

- [ ] **Step 3: Add to the submit payload**

Find (around line 973):
```typescript
        amenities: formData.amenities || [],
```
Add after:
```typescript
        property_amenities: formData.property_amenities || [],
```

- [ ] **Step 4: Add toggle handler**

Find the `toggleAmenity` function (around line 783):
```typescript
  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };
```
Add after it:
```typescript
  const togglePropertyAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      property_amenities: (prev.property_amenities || []).includes(amenity)
        ? (prev.property_amenities || []).filter((a) => a !== amenity)
        : [...(prev.property_amenities || []), amenity],
    }));
  };
```

- [ ] **Step 5: Add the dropdown UI**

Import at the top of the file (with other admin-form-options imports):
```typescript
import { PROPERTY_AMENITIES_BY_CATEGORY } from "../../shared/constants/admin-form-options";
```

Find the amenities dropdown block (around line 2289 — the section that toggles `"amenities"`), and add a new identical block immediately after the closing `</div>` of that section:

```tsx
{/* Property amenities (apartment-level features) */}
<div>
  <label className="block text-sm font-medium text-white/90 mb-2">
    What's Included
  </label>
  <div className="relative" data-dropdown>
    <div
      className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white min-h-[40px] flex items-center cursor-pointer"
      onClick={() => toggleDropdown("property_amenities")}
    >
      <div className="flex flex-wrap gap-1 flex-1">
        {(formData.property_amenities || []).length > 0 ? (
          (formData.property_amenities || []).map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
            >
              {amenity}
              <button
                type="button"
                className="ml-1 text-white/70 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setFormData({
                    ...formData,
                    property_amenities: (formData.property_amenities || []).filter(
                      (a) => a !== amenity,
                    ),
                  });
                }}
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-white/50">Select features...</span>
        )}
      </div>
      <svg className="w-5 h-5 text-white/70 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
    {openDropdown === "property_amenities" && (
      <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {PROPERTY_AMENITIES_BY_CATEGORY.map((category) => (
          <div key={category.titleKey}>
            <div className="px-4 py-2 text-xs font-semibold text-white/70 border-b border-white/10 sticky top-0 bg-gray-900/95">
              {t(category.titleKey)}
            </div>
            {category.values.map((amenity) => (
              <div
                key={amenity}
                className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                onClick={() => togglePropertyAmenity(amenity)}
              >
                <input
                  type="checkbox"
                  checked={(formData.property_amenities || []).includes(amenity)}
                  readOnly
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/components/EditPropertyModal.tsx
git commit -m "feat: add property_amenities dropdown to EditPropertyModal"
```

---

## Task 12: TypeScript Compile Check

- [ ] **Step 1: Run the TypeScript compiler on both projects**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit
cd /Users/irozhok/Desktop/Tada/tada-prod/backend && npx tsc --noEmit
```

Expected: No errors. Fix any type errors before proceeding.

- [ ] **Step 2: Start the frontend dev server and manually verify**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npm run dev
```

Verify:
1. Preferences wizard now has 12 steps
2. Step 7 shows "What's Included" with 5 groups of selection buttons
3. Step 8 still shows building amenities (unchanged)
4. Steps 9–12 are unchanged in content
5. Admin panel AddPropertyModal has a "What's Included" dropdown
6. Admin panel EditPropertyModal has a "What's Included" dropdown

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: property_amenities — complete frontend and backend implementation"
```

---

## Notes

- `listing.features.kitchen.microwave` is **missing from Localazy**. Add it via the Localazy dashboard with value "Microwave" before release. The key is already referenced in `PROPERTY_AMENITIES_GROUPS`.
- The `EditPropertyModal` is a large self-contained file (~2400 lines). The changes are isolated to 5 specific spots — grep for the anchor strings above to locate them.
- The `TOTAL_STEPS_NEW` constant may live in a separate constants file (check the import at line 36 of `NewPreferencesPage.tsx`) — update it at the source.
