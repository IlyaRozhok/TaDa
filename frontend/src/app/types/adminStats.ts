/**
 * Response of `GET /admin/stats` — hand-kept in step with
 * `backend/src/modules/admin-stats/admin-stats.types.ts`.
 *
 * Tenants only. Everything except `totals.tenants` covers tenants who signed
 * up inside `range`.
 */
export interface AdminStatsShareRow {
  value: string;
  label: string;
  count: number;
  /** Share of tenants with preferences; multi-select, so rows can sum past 100. */
  pctOfTenants: number;
}

export interface AdminStats {
  range: { from: string | null; to: string | null };
  /** `tenants` is all-time; `newThisPeriod` is tenant signups in the range. */
  totals: { tenants: number; newThisPeriod: number };
  signups: Array<{ bucket: string; tenants: number }>;
  funnel: {
    tenants: number;
    withPreferences: number;
    cvCompleted: number;
    cvShared: number;
  };
  age: { groups: Array<{ group: string; count: number }>; unknown: number };
  /** Normalized to the dropdown's country names ("British" → "United Kingdom"). */
  nationality: {
    items: Array<{ value: string; count: number }>;
    other: number;
    unknown: number;
  };
  occupation: { base: number; items: AdminStatsShareRow[]; unknown: number };
  familyStatus: { base: number; items: AdminStatsShareRow[]; unknown: number };
  budget: { buckets: Array<{ bucket: string; count: number }>; unknown: number };
  areas: { items: Array<{ value: string; count: number }>; unknown: number };
}

/** Signup-date range, `YYYY-MM-DD`; an empty side is open. */
export interface AdminStatsRange {
  from?: string;
  to?: string;
}
