import React from "react";

import { paletteAt } from "./palette";

export interface BarDatum {
  label: string;
  value: number;
  /** Text shown at the end of the row; defaults to the value. */
  display?: string;
  /** Palette slot; defaults to the first colour. */
  colorIndex?: number;
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  /** Full-width value; defaults to the largest value. */
  max?: number;
  emptyText?: string;
}

/** One labelled row per datum, the bar drawn as a stretchable SVG rect. */
export default function HorizontalBarChart({
  data,
  max,
  emptyText = "No data yet",
}: HorizontalBarChartProps) {
  if (!data.length) {
    return <p className="text-sm text-gray-500 py-6 text-center">{emptyText}</p>;
  }

  const scale = max ?? Math.max(...data.map((d) => d.value), 0);

  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const width = scale > 0 ? Math.min(100, (d.value / scale) * 100) : 0;
        const display = d.display ?? String(d.value);
        return (
          <li key={d.label}>
            <div className="flex justify-between gap-3 text-sm mb-1">
              <span className="text-gray-700 truncate">{d.label}</span>
              <span className="font-medium text-black tabular-nums flex-shrink-0">{display}</span>
            </div>
            {/* Stretched to the row, so the rounding lives on the wrapper:
                an rx inside a non-uniformly scaled SVG would turn elliptical. */}
            <svg
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              className="block w-full h-2.5 rounded-full overflow-hidden"
              role="img"
              aria-label={`${d.label}: ${display}`}
            >
              <rect width="100" height="8" className="fill-gray-100" />
              <rect
                width={width}
                height="8"
                className={paletteAt(d.colorIndex ?? 0).fill}
              >
                <title>{`${d.label}: ${display}`}</title>
              </rect>
            </svg>
          </li>
        );
      })}
    </ul>
  );
}
