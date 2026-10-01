import React from "react";

import { linePoints, niceMax } from "@/app/lib/chartGeometry";
import { paletteAt } from "./palette";

export interface LineSeries {
  name: string;
  values: number[];
  colorIndex: number;
}

interface LineChartProps {
  labels: string[];
  series: LineSeries[];
}

const WIDTH = 720;
const HEIGHT = 220;
const PAD = { top: 12, right: 16, bottom: 28, left: 36 };
const GRID_LINES = 4;

/** Multi-series line chart with a y grid and every-nth x label. */
export default function LineChart({ labels, series }: LineChartProps) {
  if (!labels.length) {
    return <p className="text-sm text-gray-500 py-10 text-center">No signups in this period</p>;
  }

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 0));
  // Keep roughly a dozen x labels however long the range is.
  const labelEvery = Math.max(1, Math.ceil(labels.length / 12));
  const xAt = (i: number) =>
    PAD.left + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2);

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Signups over time">
        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const value = (max / GRID_LINES) * i;
          const y = PAD.top + plotH - (value / max) * plotH;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} className="stroke-gray-100" />
              <text x={PAD.left - 6} y={y} textAnchor="end" dominantBaseline="central" className="fill-gray-500 text-[10px]">
                {Number.isInteger(value) ? value : value.toFixed(1)}
              </text>
            </g>
          );
        })}

        {labels.map((label, i) =>
          i % labelEvery === 0 || i === labels.length - 1 ? (
            <text key={label} x={xAt(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-gray-500 text-[10px]">
              {label}
            </text>
          ) : null,
        )}

        {series.map((s) => {
          const points = linePoints(s.values, { width: plotW, height: plotH, max }).map((p) => ({
            x: p.x + PAD.left,
            y: p.y + PAD.top,
          }));
          const colour = paletteAt(s.colorIndex);
          return (
            <g key={s.name}>
              <polyline
                points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                strokeWidth="2"
                strokeLinejoin="round"
                className={colour.stroke}
              />
              {points.map((p, i) => (
                <circle key={labels[i]} cx={p.x} cy={p.y} r="3.5" className={colour.fill}>
                  <title>{`${labels[i]} · ${s.name}: ${s.values[i]}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="flex gap-4 text-sm mt-2">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-2 text-gray-700">
            <span className={`w-3 h-3 rounded-full ${paletteAt(s.colorIndex).bg}`} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
