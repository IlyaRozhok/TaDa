/**
 * Hook for getting localized form options that match preferences UI values
 * This ensures consistency between preferences and admin forms
 */

import { useTranslation } from "../../app/hooks/useTranslation";
import { wizardKeys } from "../../app/lib/translationsKeys/wizardTranslationKeys";

export interface FormOption {
  value: string;
  label: string;
}

export interface NumberFormOption {
  value: number;
  label: string;
}

export function useLocalizedFormOptions() {
  const { t } = useTranslation();

  // Property Types - matches preferences step 3
  const propertyTypeOptions: FormOption[] = [
    { value: "apartment", label: t("property.type.name1") }, // "Apartment"
    { value: "flat", label: t("property.type.name2") }, // "Flat"
    { value: "studio", label: t("property.type.name3") }, // "Studio"
    { value: "penthouse", label: t("property.type.name4") }, // "Penthouse"
    { value: "room", label: t("property.type.name5") }, // "En-suite room"
    { value: "room", label: t("property.type.name6") }, // "Room" (duplicate value, different label)
  ];

  // Building Unit Types - derived from property types + bedroom counts
  const buildingUnitTypeOptions: FormOption[] = [
    { value: "studio", label: t("property.type.name3") }, // "Studio"
    { value: "1-bed", label: "1 bedroom" }, // Not directly from translations
    { value: "2-bed", label: "2 bedrooms" },
    { value: "3-bed", label: "3 bedrooms" },
    { value: "Duplex", label: "Duplex" },
    { value: "penthouse", label: t("property.type.name4") }, // "Penthouse"
  ];

  // Furnishing Options - matches preferences step 3
  const furnishingOptions: FormOption[] = [
    { value: "furnished", label: t("furnishing.count.name1") }, // "Furnished"
    { value: "unfurnished", label: t("furnishing.count.name2") }, // "Unfurnished"
    { value: "part_furnished", label: t("furnishing.count.name3") }, // "Part-furnished"
    { value: "designer_furniture", label: "Designer furniture" }, // Admin-only option
  ];

  // Outdoor Space Options - matches preferences step 3
  const outdoorSpaceOptions: FormOption[] = [
    { value: "balcony", label: t("outdoorspace.name1") }, // "Balcony"
    { value: "terrace", label: t("outdoorspace.name2") }, // "Terrace"
    { value: "outdoor_space", label: "Outdoor Space" }, // Generic option
  ];

  // Bedrooms Options - matches preferences step 3
  const bedroomsOptions: NumberFormOption[] = [
    { value: 0, label: t("property.type.name3") }, // "Studio" (0 bedrooms)
    { value: 1, label: t("rooms.count.name1") + " bedroom" }, // "1 bedroom"
    { value: 2, label: t("rooms.count.name2") + " bedrooms" }, // "2 bedrooms"
    { value: 3, label: t("rooms.count.name3") + " bedrooms" }, // "3 bedrooms"
    { value: 4, label: t("rooms.count.name4") + " bedrooms" }, // "4 bedrooms"
    { value: 5, label: t("rooms.count.name5") + " bedrooms" }, // "5+ bedrooms"
  ];

  // Bathrooms Options - matches preferences step 3
  const bathroomsOptions: NumberFormOption[] = [
    { value: 1, label: t("bathrooms.count.name1") + " bathroom" }, // "1 bathroom"
    { value: 2, label: t("bathrooms.count.name2") + " bathrooms" }, // "2 bathrooms"
    { value: 3, label: t("bathrooms.count.name3") + " bathrooms" }, // "3 bathrooms"
    { value: 4, label: t("bathrooms.count.name4") + " bathrooms" }, // "4+ bathrooms"
  ];

  // Building Types - matches preferences step 4
  const buildingTypeOptions: FormOption[] = [
    { value: "btr", label: t(wizardKeys.step4.buildtype[0]) }, // "Build-to-Rent"
    { value: "co_living", label: t(wizardKeys.step4.buildtype[1]) }, // "Co-living"
    {
      value: "professional_management",
      label: t(wizardKeys.step4.buildtype[2]),
    }, // "Professionally managed building"
    { value: "private_landlord", label: t(wizardKeys.step4.buildtype[3]) }, // "Private Landlord"
  ];

  // Duration Options - matches preferences step 4
  const durationOptions: FormOption[] = [
    { value: "short_term", label: t(wizardKeys.step4.rentalDuration[0]) }, // "Short term (1–6 months)"
    { value: "long_term", label: t(wizardKeys.step4.rentalDuration[1]) }, // "Medium term (6–12 months)" -> maps to long_term
    { value: "long_term", label: t(wizardKeys.step4.rentalDuration[2]) }, // "Long term (12+ months)"
    { value: "flexible", label: t(wizardKeys.step4.rentalDuration[3]) }, // "Flexible"
  ];

  // Bills Options - matches preferences step 4
  const billsOptions: FormOption[] = [
    { value: "included", label: t(wizardKeys.step4.bills[0]) }, // "Include"
    { value: "excluded", label: t(wizardKeys.step4.bills[1]) }, // "Exclude"
  ];

  // Tenant Types - matches preferences step 5
  const tenantTypeOptions: FormOption[] = [
    { value: "corporateLets", label: t(wizardKeys.step5.tenantType[0]) }, // "Professional"
    { value: "student", label: t(wizardKeys.step5.tenantType[1]) }, // "Student"
    { value: "corporateLets", label: t(wizardKeys.step5.tenantType[2]) }, // "Corporate tenant"
    { value: "family", label: t(wizardKeys.step5.tenantType[3]) }, // "Family"
    { value: "sharers", label: t(wizardKeys.step5.tenantType[4]) }, // "Sharers / Friends"
    { value: "family", label: t(wizardKeys.step5.tenantType[5]) }, // "Other" -> maps to family
  ];

  return {
    propertyTypeOptions,
    buildingUnitTypeOptions,
    furnishingOptions,
    outdoorSpaceOptions,
    bedroomsOptions,
    bathroomsOptions,
    buildingTypeOptions,
    durationOptions,
    billsOptions,
    tenantTypeOptions,
  };
}

// Helper function to get unique options (removes duplicates by value)
export function getUniqueOptions<T extends { value: any }>(options: T[]): T[] {
  const seen = new Set();
  return options.filter((option) => {
    if (seen.has(option.value)) {
      return false;
    }
    seen.add(option.value);
    return true;
  });
}
