// Canonical list of amenities values used across preferences and admin forms.
// Items 1–22: wizard step 7 amenities.name1–22; item 23: preferences.amenities.smoking.area.
export const AMENITIES_VALUES = [
  "Co-working spaces", // 1
  "Meeting rooms", // 2
  "Concierge", // 3
  "Parcel lockers", // 4
  "Maintenance", // 5
  "Wi-Fi included", // 6
  "Wi-Fi throughout", // 7
  "Parking", // 8
  "Storage units", // 9
  "Bike storage", // 10
  "Zoom Booths", // 11
  "Printing station", // 12
  "Cleaning services", // 13
  "Laundry services", // 14
  "Short-stay rentals", // 15
  "24/7 security", // 16
  "Keyless entry", // 17
  "CCTV", // 18
  "Dog wash station", // 19
  "Pet daycare", // 20
  "Kids playroom", // 21
  "Nursery area", // 22
  "Smoking area", // 23 — label: preferences.amenities.smoking.area
] as const;

/** Localazy key by stored amenity string (when not using wizard amenities.name*). */
export const AMENITY_LABEL_I18N_KEY: Partial<
  Record<(typeof AMENITIES_VALUES)[number], string>
> = {
  "Smoking area": "preferences.amenities.smoking.area", // sync with preferencesAmenityKeys.smokingArea
};

export function translateAmenityStoredLabel(
  storedValue: string,
  t: (key: string) => string,
): string {
  const key = AMENITY_LABEL_I18N_KEY[storedValue as keyof typeof AMENITY_LABEL_I18N_KEY];
  return key ? t(key) : storedValue;
}

