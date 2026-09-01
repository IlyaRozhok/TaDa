/**
 * The onboarding wizard stores multi-select lifestyle answers as one
 * comma-joined string ("student,young-professional") — the DTOs accept the
 * list form explicitly. Every scorer that compares such a field must compare
 * any-of over the selected values, never the joined string itself.
 */
export function splitPreferenceList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
