export interface ShareRow {
  value: string;
  label: string;
  count: number;
  pctOfTenants: number;
}

/**
 * Response of `GET /admin/stats`. Everything except `totals.tenants` and
 * `totals.operators` is scoped to users who signed up inside the requested
 * range (all time when no range is given). Demographics and preference
 * breakdowns cover tenants only; every breakdown reports its `unknown` count
 * so gaps in the data stay visible.
 */
export interface AdminStatsResponse {
  range: { from: string | null; to: string | null };
  totals: {
    /** All-time, independent of the range. */
    tenants: number;
    /** All-time, independent of the range. */
    operators: number;
    /** Tenant + operator signups inside the range. */
    newThisPeriod: number;
  };
  /** Monthly buckets (`YYYY-MM`), empty months included. */
  signups: Array<{ bucket: string; tenants: number; operators: number }>;
  roles: Array<{ role: "tenant" | "operator"; count: number }>;
  funnel: {
    tenants: number;
    withPreferences: number;
    cvCompleted: number;
    cvShared: number;
  };
  age: { groups: Array<{ group: string; count: number }>; unknown: number };
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
