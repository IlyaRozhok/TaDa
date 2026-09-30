/**
 * Series colours for the admin charts, as full Tailwind class names so the
 * compiler sees every one. `fill`/`stroke` paint SVG, `bg` the legend dots.
 */
export const CHART_PALETTE = [
  { fill: "fill-gray-900", stroke: "stroke-gray-900", bg: "bg-gray-900" },
  { fill: "fill-sky-500", stroke: "stroke-sky-500", bg: "bg-sky-500" },
  { fill: "fill-amber-500", stroke: "stroke-amber-500", bg: "bg-amber-500" },
  { fill: "fill-emerald-500", stroke: "stroke-emerald-500", bg: "bg-emerald-500" },
  { fill: "fill-rose-500", stroke: "stroke-rose-500", bg: "bg-rose-500" },
  { fill: "fill-violet-500", stroke: "stroke-violet-500", bg: "bg-violet-500" },
  { fill: "fill-gray-400", stroke: "stroke-gray-400", bg: "bg-gray-400" },
] as const;

export const paletteAt = (index: number) =>
  CHART_PALETTE[index % CHART_PALETTE.length];
