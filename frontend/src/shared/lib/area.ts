/** Convert square feet to square meters (rounded to 2 decimal places) */
export const sqFtToSqM = (sqFt: number): number =>
  Math.round(sqFt * 0.09290304 * 100) / 100;

/** Convert square meters to square feet (rounded to nearest integer) */
export const sqMToSqFt = (sqM: number): number =>
  Math.round(sqM * 10.763910417);

/**
 * Format area for display in listings/cards.
 * Input: square meters (what the DB stores).
 * Output: "1,561 sq ft (145 m²)"
 */
export const formatAreaDisplay = (
  sqM: number | null | undefined
): string | null => {
  if (sqM == null || isNaN(Number(sqM))) return null;
  const sqFt = sqMToSqFt(Number(sqM));
  const sqMRounded = Math.round(Number(sqM));
  return `${sqFt.toLocaleString("en-GB")} sq ft (${sqMRounded} m²)`;
};

/**
 * Format square meters for read-only form field (comma decimal, 2dp).
 * "145,02" style.
 */
export const formatSqMForForm = (sqM: number | null | undefined): string => {
  if (sqM == null || isNaN(Number(sqM))) return "";
  return Number(sqM).toFixed(2).replace(".", ",");
};
