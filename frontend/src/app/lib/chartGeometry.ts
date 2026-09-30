/**
 * Geometry for the hand-drawn SVG charts on the admin Statistics page.
 * Kept free of React so it can be tested as plain functions.
 */

export interface DonutSlice {
  index: number;
  value: number;
  fraction: number;
  path: string;
}

const polar = (cx: number, cy: number, r: number, angle: number) => ({
  x: cx + r * Math.sin(angle),
  y: cy - r * Math.cos(angle),
});

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * One ring segment per positive value, clockwise from 12 o'clock. A lone
 * slice is drawn as two half-rings, since an SVG arc cannot close on itself.
 */
export function donutSlices(
  values: ReadonlyArray<number>,
  { cx, cy, r, inner }: { cx: number; cy: number; r: number; inner: number },
): DonutSlice[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  if (total <= 0) return [];

  const segment = (start: number, end: number) => {
    const large = end - start > Math.PI ? 1 : 0;
    const o1 = polar(cx, cy, r, start);
    const o2 = polar(cx, cy, r, end);
    const i1 = polar(cx, cy, inner, end);
    const i2 = polar(cx, cy, inner, start);
    return [
      `M${round(o1.x)} ${round(o1.y)}`,
      `A${r} ${r} 0 ${large} 1 ${round(o2.x)} ${round(o2.y)}`,
      `L${round(i1.x)} ${round(i1.y)}`,
      `A${inner} ${inner} 0 ${large} 0 ${round(i2.x)} ${round(i2.y)}`,
      "Z",
    ].join(" ");
  };

  const slices: DonutSlice[] = [];
  let angle = 0;
  values.forEach((value, index) => {
    if (value <= 0) return;
    const fraction = value / total;
    const end = angle + fraction * 2 * Math.PI;
    const path =
      fraction >= 1
        ? `${segment(0, Math.PI)} ${segment(Math.PI, 2 * Math.PI)}`
        : segment(angle, end);
    slices.push({ index, value, fraction, path });
    angle = end;
  });
  return slices;
}

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
