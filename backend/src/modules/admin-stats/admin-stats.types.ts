export interface ShareRow {
  value: string;
  label: string;
  count: number;
  pctOfTenants: number;
}

/**
 * Response of `GET /admin/stats`. Tenants only. Everything except
 * `totals.tenants` is scoped to tenants who signed up inside the requested
 * range (all time when no range is given); every breakdown reports its
 * `unknown` count so gaps in the data stay visible.
 */
export interface AdminStatsResponse {
  range: { from: string | null; to: string | null };
  totals: {
    /** All-time, independent of the range. */
    tenants: number;
    /** Tenant signups inside the range. */
    newThisPeriod: number;
  };
  /** Monthly tenant signups (`YYYY-MM`), empty months included. */
  signups: Array<{ bucket: string; tenants: number }>;
  funnel: {
    tenants: number;
    withPreferences: number;
    cvCompleted: number;
  };
  age: { groups: Array<{ group: string; count: number }>; unknown: number };
  /** Normalized to the dropdown's country names ("British" → "United Kingdom"). */
  nationality: {
    items: Array<{ value: string; count: number }>;
    other: number;
    unknown: number;
  };
  /** Shares are of `base` (tenants with preferences); multi-select, so they can sum past 100%. */
  occupation: { base: number; items: ShareRow[]; unknown: number };
  familyStatus: { base: number; items: ShareRow[]; unknown: number };
  budget: { buckets: Array<{ bucket: string; count: number }>; unknown: number };
  areas: { items: Array<{ value: string; count: number }>; unknown: number };
}
