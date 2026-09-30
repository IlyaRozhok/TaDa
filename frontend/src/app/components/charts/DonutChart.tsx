import React from "react";

import { donutSlices, percent } from "@/app/lib/chartGeometry";
import { paletteAt } from "./palette";

export interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartProps {
  data: DonutDatum[];
  /** Big number in the hole; defaults to the total. */
  centerValue?: string;
  centerLabel?: string;
}

const SIZE = 160;
const RING = { cx: SIZE / 2, cy: SIZE / 2, r: SIZE / 2, inner: SIZE / 2 - 26 };

/** Donut with a legend of value and share per slice. */
export default function DonutChart({ data, centerValue, centerLabel }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const slices = donutSlices(
    data.map((d) => d.value),
    RING,
  );

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-40 h-40 flex-shrink-0"
        role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}
      >
        {slices.length ? (
          slices.map((slice) => (
            <path key={slice.index} d={slice.path} className={paletteAt(slice.index).fill}>
              <title>
                {`${data[slice.index].label}: ${slice.value} (${percent(slice.value, total)}%)`}
              </title>
            </path>
          ))
        ) : (
          <circle
            cx={RING.cx}
            cy={RING.cy}
            r={(RING.r + RING.inner) / 2}
            className="fill-none stroke-gray-200"
            strokeWidth={RING.r - RING.inner}
          />
        )}
        <text
          x={RING.cx}
          y={RING.cy}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-900 text-2xl font-semibold"
        >
          {centerValue ?? total}
        </text>
        {centerLabel && (
          <text
            x={RING.cx}
            y={RING.cy + 20}
            textAnchor="middle"
            className="fill-gray-500 text-[10px]"
          >
            {centerLabel}
          </text>
        )}
      </svg>

      <ul className="space-y-2 text-sm w-full">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${paletteAt(i).bg}`} />
            <span className="text-gray-700 flex-1">{d.label}</span>
            <span className="font-medium text-black tabular-nums">{d.value}</span>
            <span className="text-gray-500 tabular-nums w-14 text-right">
              {percent(d.value, total)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
