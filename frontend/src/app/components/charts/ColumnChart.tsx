import React from "react";

import { niceMax } from "@/app/lib/chartGeometry";
import { paletteAt } from "./palette";

export interface ColumnDatum {
  label: string;
  value: number;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  colorIndex?: number;
}

const MIN_SLOT = 70;
const HEIGHT = 160;
const LABEL_SPACE = 30;
const VALUE_SPACE = 14;

/** Vertical bars for ordered buckets (age groups, budget ranges). */
export default function ColumnChart({ data, colorIndex = 0 }: ColumnChartProps) {
  // Wide enough that bucket labels like "£1,000-1,499" never overlap.
  const width = Math.max(320, data.length * MIN_SLOT);
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const plot = HEIGHT - LABEL_SPACE - VALUE_SPACE;
  const slot = data.length ? width / data.length : width;
  const barWidth = Math.min(40, slot * 0.6);

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      className="w-full h-auto"
      role="img"
      aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}
    >
      <line
        x1="0"
        x2={width}
        y1={VALUE_SPACE + plot}
        y2={VALUE_SPACE + plot}
        className="stroke-gray-200"
      />
      {data.map((d, i) => {
        const h = (d.value / max) * plot;
        const x = i * slot + (slot - barWidth) / 2;
        const y = VALUE_SPACE + plot - h;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx="3"
              className={paletteAt(colorIndex).fill}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              className="fill-gray-900 text-[10px] font-medium"
            >
              {d.value}
            </text>
            <text
              x={i * slot + slot / 2}
              y={HEIGHT - LABEL_SPACE / 2}
              textAnchor="middle"
              className="fill-gray-500 text-[9px]"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
