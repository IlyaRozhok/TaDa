// Canonical list of amenities values used across preferences and admin forms.
// 1–9: work; 10–15: services (incl. Smoking area → preferences.amenities.smoking.area); 16–21: rest.
export const AMENITIES_VALUES = [
  "Co-working spaces", // 1
  "Meeting rooms", // 2
  "Concierge", // 3
  "Parcel lockers", // 4
  "Maintenance", // 5
  "Wi-Fi throughout", // 6
  "Parking", // 7
  "Storage units", // 8
  "Bike storage", // 9
  "Zoom Booths", // 11
  "Printing station", // 12
  "Cleaning services", // 13
  "Laundry services", // 14
  "Short-stay rentals", // 15
  "Smoking area", // 16 — label: preferences.amenities.smoking.area
  "24/7 security", // 17
  "Keyless entry", // 18
  "CCTV", // 19
  "Dog wash station", // 20
  "Pet daycare", // 21
  "Kids playroom", // 22
  "Nursery area", // 23
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

