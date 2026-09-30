/**
 * Geometry for the hand-drawn SVG charts on the admin Tenant Statistics page.
 * Kept free of React so it can be tested as plain functions.
 */

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Rounds an axis maximum up to 1, 2 or 5 × 10ⁿ; never below 1. */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
}

/** SVG polyline points for a series spread evenly across `width`. */
export function linePoints(
  values: ReadonlyArray<number>,
  { width, height, max }: { width: number; height: number; max: number },
): Array<{ x: number; y: number }> {
  if (!values.length) return [];
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const x0 = values.length > 1 ? 0 : width / 2;
  return values.map((v, i) => ({
    x: round(x0 + i * stepX),
    y: round(height - (max > 0 ? (v / max) * height : 0)),
  }));
}

/** Percentage with one decimal, 0 for an empty base. */
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

// A fixed table, not toLocaleString: ICU versions disagree ("Sep" vs "Sept").
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09" → "Sep 26" for axis labels. */
export function monthLabel(bucket: string): string {
  const [year, month] = bucket.split("-").map(Number);
  if (!year || !month || month > 12) return bucket;
  return `${MONTHS[month - 1]} ${String(year).slice(2)}`;
}
