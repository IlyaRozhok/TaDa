import React from "react";
import { BarChart3 } from "lucide-react";

import type { AdminStats, AdminStatsRange } from "@/app/types/adminStats";
import { monthLabel, percent } from "@/app/lib/chartGeometry";
import ColumnChart from "@/app/components/charts/ColumnChart";
import HorizontalBarChart from "@/app/components/charts/HorizontalBarChart";
import LineChart from "@/app/components/charts/LineChart";

interface AdminStatisticsSectionProps {
  stats?: AdminStats;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  range: AdminStatsRange;
  onRangeChange: (range: AdminStatsRange) => void;
}

const AGE_LABELS: Record<string, string> = { "under-18": "Under 18" };

/** Local calendar date as `YYYY-MM-DD`, the shape the date inputs and API use. */
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDate(d);
};

const PRESETS: Array<{ label: string; range: () => AdminStatsRange }> = [
  { label: "All time", range: () => ({}) },
  { label: "Last 30 days", range: () => ({ from: daysAgo(30), to: isoDate(new Date()) }) },
  { label: "Last 90 days", range: () => ({ from: daysAgo(90), to: isoDate(new Date()) }) },
  {
    label: "This year",
    range: () => ({ from: `${new Date().getFullYear()}-01-01`, to: isoDate(new Date()) }),
  },
];

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-semibold text-black mt-1 tabular-nums">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  );
}

/** A chart card; `unknown` is always shown so gaps in the data stay visible. */
function ChartCard({
  title,
  subtitle,
  unknown,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  unknown?: { count: number; label?: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col ${className}`}>
      <div className="mb-4">
        <h4 className="text-base font-semibold text-black">{title}</h4>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1">{children}</div>
      {unknown && (
        <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
          {unknown.label ?? "No value"}: <span className="font-medium tabular-nums">{unknown.count}</span>
        </p>
      )}
    </div>
  );
}

export default function AdminStatisticsSection({
  stats,
  isLoading,
  isFetching,
  isError,
  range,
  onRangeChange,
}: AdminStatisticsSectionProps) {
  const invalidRange = Boolean(range.from && range.to && range.from > range.to);
  const activePreset = PRESETS.find((p) => {
    const r = p.range();
    return (r.from ?? "") === (range.from ?? "") && (r.to ?? "") === (range.to ?? "");
  });

  const header = (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <h3 className="text-2xl font-semibold text-black">Tenant Statistics</h3>
        <p className="text-black">Which tenants sign up. Filters by signup date.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onRangeChange(preset.range())}
              className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                activePreset?.label === preset.label
                  ? "bg-black text-white"
                  : "bg-white border border-gray-200 text-black hover:bg-gray-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          From
          <input
            type="date"
            value={range.from ?? ""}
            max={range.to || undefined}
            onChange={(e) => onRangeChange({ ...range, from: e.target.value || undefined })}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-black bg-white"
          />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          To
          <input
            type="date"
            value={range.to ?? ""}
            min={range.from || undefined}
            onChange={(e) => onRangeChange({ ...range, to: e.target.value || undefined })}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-black bg-white"
          />
        </label>
      </div>
    </div>
  );

  if (invalidRange) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-sm text-rose-600">&quot;From&quot; must not be after &quot;To&quot;.</p>
      </div>
    );
  }

  if (isLoading || (!stats && !isError)) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex items-center justify-center gap-2 py-20 text-black">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span>Loading statistics…</span>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex flex-col items-center py-20 text-black">
          <BarChart3 className="w-12 h-12 mb-4" />
          <p>Could not load statistics. Try again in a moment.</p>
        </div>
      </div>
    );
  }

  const { totals, funnel } = stats;
  const periodHint = range.from || range.to ? "signed up in the selected period" : "all time";

  const nationalityRows = [
    ...stats.nationality.items.map((n) => ({ label: n.value, value: n.count })),
    ...(stats.nationality.other ? [{ label: "Other", value: stats.nationality.other, colorIndex: 6 }] : []),
  ];

  return (
    <div className={`space-y-6 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
      {header}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tile label="Tenants" value={String(totals.tenants)} hint="all time" />
        <Tile label="New tenant signups" value={String(totals.newThisPeriod)} hint={periodHint} />
        <Tile
          label="CV completed"
          value={`${percent(funnel.cvCompleted, funnel.tenants)}%`}
          hint={`${funnel.cvCompleted} of ${funnel.tenants} tenants, ${periodHint}`}
        />
      </div>

      {/* Signups (wide) beside the funnel, so the six breakdowns below pair
          up evenly in the two-column grid. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Tenant signups over time" subtitle="Per month" className="lg:col-span-2">
          <LineChart
            labels={stats.signups.map((s) => monthLabel(s.bucket))}
            series={[
              { name: "Tenants", values: stats.signups.map((s) => s.tenants), colorIndex: 0 },
            ]}
          />
        </ChartCard>

        <ChartCard title="Tenant funnel" subtitle={`Share of tenants, ${periodHint}`}>
          <HorizontalBarChart
            max={funnel.tenants}
            data={[
              {
                label: "Signed up",
                value: funnel.tenants,
                hint: "Tenants who created an account in the selected period.",
              },
              {
                label: "Filled preferences",
                value: funnel.withPreferences,
                hint: "Tenants who saved the search-preferences wizard at least once (budget, areas, lifestyle).",
              },
              {
                label: "Completed CV",
                value: funnel.cvCompleted,
                hint: "Tenants who finished the CV flow and pressed Finish.",
              },
            ].map((row) => ({
              ...row,
              display: `${row.value} · ${percent(row.value, funnel.tenants)}%`,
            }))}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Age" subtitle="Tenants, from date of birth" unknown={{ count: stats.age.unknown, label: "No date of birth" }}>
          <ColumnChart
            data={stats.age.groups.map((g) => ({ label: AGE_LABELS[g.group] ?? g.group, value: g.count }))}
          />
        </ChartCard>

        <ChartCard
          title="Nationality"
          subtitle="Tenants, top 10"
          unknown={{ count: stats.nationality.unknown, label: "No nationality" }}
        >
          <HorizontalBarChart data={nationalityRows} />
        </ChartCard>

        <ChartCard
          title="Occupation"
          subtitle={`Share of ${stats.occupation.base} tenants with preferences · multi-select, can exceed 100%`}
          unknown={{ count: stats.occupation.unknown, label: "No occupation picked" }}
        >
          <HorizontalBarChart
            max={100}
            data={stats.occupation.items.map((o) => ({
              label: o.label,
              value: o.pctOfTenants,
              display: `${o.pctOfTenants}% (${o.count})`,
              colorIndex: 3,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Family status"
          subtitle={`Share of ${stats.familyStatus.base} tenants with preferences · multi-select`}
          unknown={{ count: stats.familyStatus.unknown, label: "No family status picked" }}
        >
          <HorizontalBarChart
            max={100}
            data={stats.familyStatus.items.map((f) => ({
              label: f.label,
              value: f.pctOfTenants,
              display: `${f.pctOfTenants}% (${f.count})`,
              colorIndex: 5,
            }))}
          />
        </ChartCard>

        <ChartCard title="Budget" subtitle="Tenants' maximum monthly rent" unknown={{ count: stats.budget.unknown, label: "No budget set" }}>
          <ColumnChart
            colorIndex={2}
            data={stats.budget.buckets.map((b) => ({ label: b.bucket, value: b.count }))}
          />
        </ChartCard>

        <ChartCard title="Preferred areas" subtitle="Tenants, top 10" unknown={{ count: stats.areas.unknown, label: "No area picked" }}>
          <HorizontalBarChart
            data={stats.areas.items.map((a) => ({ label: a.value, value: a.count, colorIndex: 1 }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}
