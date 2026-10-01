import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  CountRow,
  FAMILY_STATUS_LABELS,
  OCCUPATION_LABELS,
  bucketAges,
  bucketBudgets,
  fillMonths,
  mergeNationalities,
  topNWithOther,
  withShares,
} from "./admin-stats.helpers";
import { AdminStatsResponse } from "./admin-stats.types";

const TOP_NATIONALITIES = 10;
const TOP_AREAS = 10;

/**
 * Signup-date cohort on `users u`. Every query binds the same two parameters
 * ($1 = from, $2 = to, both `YYYY-MM-DD` or null), so an open side of the
 * range is simply a null bound. `to` covers its whole day.
 */
const COHORT = `($1::date IS NULL OR u.created_at >= $1::date)
  AND ($2::date IS NULL OR u.created_at < $2::date + 1)`;

/**
 * Tenants in the cohort joined to their (at most one — `user_id` is unique)
 * preferences row.
 */
const TENANT_PREFERENCES = `FROM users u
  JOIN preferences p ON p.user_id = u.id
  WHERE u.role = 'tenant' AND ${COHORT}`;

/**
 * The wizard stores these multi-selects as one comma-joined varchar, so each
 * row is split and counted per value. Column names come from this whitelist,
 * never from the request.
 */
type MultiSelectColumn = "occupation" | "family_status";

const multiSelectSql = (column: MultiSelectColumn) => `
  SELECT btrim(v) AS value, COUNT(DISTINCT u.id)::int AS count
  FROM users u
  JOIN preferences p ON p.user_id = u.id
  CROSS JOIN LATERAL unnest(string_to_array(p.${column}, ',')) AS v
  WHERE u.role = 'tenant' AND ${COHORT} AND btrim(v) <> ''
  GROUP BY 1`;

/** A jsonb column that is not an array is treated as empty, never as an error. */
const AREAS_ARRAY = `CASE WHEN jsonb_typeof(p.preferred_areas) = 'array'
  THEN p.preferred_areas ELSE '[]'::jsonb END`;

@Injectable()
export class AdminStatsService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * One bundle for the admin Tenant Statistics page. Each metric is a single
   * aggregate or GROUP BY query and they all run concurrently; only grouped
   * counts ever reach Node.
   */
  async getStats(from?: string, to?: string): Promise<AdminStatsResponse> {
    const params = [from ?? null, to ?? null];
    const run = <T>(sql: string) => this.dataSource.query(sql, params) as Promise<T[]>;

    const [
      [totals],
      signupRows,
      [funnel],
      ageRows,
      nationalityRows,
      [coverage],
      occupationRows,
      familyRows,
      budgetRows,
      areaRows,
    ] = await Promise.all([
      run<AdminStatsResponse["totals"]>(`
        SELECT
          COUNT(*)::int AS tenants,
          COUNT(*) FILTER (WHERE ${COHORT})::int AS "newThisPeriod"
        FROM users u
        WHERE u.role = 'tenant'`),
      run<{ bucket: string; tenants: number }>(`
        SELECT
          to_char(date_trunc('month', u.created_at), 'YYYY-MM') AS bucket,
          COUNT(*)::int AS tenants
        FROM users u
        WHERE u.role = 'tenant' AND ${COHORT}
        GROUP BY 1
        ORDER BY 1`),
      // preferences.user_id and tenant_cvs.user_id are both unique, so the
      // joins cannot fan a tenant out into several rows. No "shared CV" step:
      // share_uuid is minted for every tenant at signup, so it measures
      // nothing about sharing.
      run<AdminStatsResponse["funnel"]>(`
        SELECT
          COUNT(*)::int AS tenants,
          COUNT(p.id)::int AS "withPreferences",
          COUNT(cv.completed_at)::int AS "cvCompleted"
        FROM users u
        LEFT JOIN preferences p ON p.user_id = u.id
        LEFT JOIN tenant_cvs cv ON cv.user_id = u.id
        WHERE u.role = 'tenant' AND ${COHORT}`),
      run<{ age: number | null; count: number }>(`
        SELECT date_part('year', age(u.date_of_birth))::int AS age, COUNT(*)::int AS count
        FROM users u
        WHERE u.role = 'tenant' AND ${COHORT}
        GROUP BY 1`),
      run<CountRow>(`
        SELECT NULLIF(btrim(u.nationality), '') AS value, COUNT(*)::int AS count
        FROM users u
        WHERE u.role = 'tenant' AND ${COHORT}
        GROUP BY 1`),
      run<{
        withPreferences: number;
        occupationUnknown: number;
        familyStatusUnknown: number;
        areasUnknown: number;
      }>(`
        SELECT
          COUNT(*)::int AS "withPreferences",
          COUNT(*) FILTER (WHERE NULLIF(btrim(p.occupation), '') IS NULL)::int AS "occupationUnknown",
          COUNT(*) FILTER (WHERE NULLIF(btrim(p.family_status), '') IS NULL)::int AS "familyStatusUnknown",
          COUNT(*) FILTER (WHERE jsonb_array_length(${AREAS_ARRAY}) = 0)::int AS "areasUnknown"
        ${TENANT_PREFERENCES}`),
      run<CountRow>(multiSelectSql("occupation")),
      run<CountRow>(multiSelectSql("family_status")),
      run<{ price: number | null; count: number }>(`
        SELECT p.max_price AS price, COUNT(*)::int AS count
        ${TENANT_PREFERENCES}
        GROUP BY 1`),
      run<{ value: string; count: number }>(`
        SELECT btrim(a) AS value, COUNT(DISTINCT u.id)::int AS count
        FROM users u
        JOIN preferences p ON p.user_id = u.id
        CROSS JOIN LATERAL jsonb_array_elements_text(${AREAS_ARRAY}) AS a
        WHERE u.role = 'tenant' AND ${COHORT} AND btrim(a) <> ''
        GROUP BY 1
        ORDER BY 2 DESC, 1
        LIMIT ${TOP_AREAS}`),
    ]);

    const base = coverage.withPreferences;
    // Grouped raw in SQL, then merged in Node: "British" and "United Kingdom"
    // are one country, and the alias map is easier to extend here than in SQL.
    const nationality = topNWithOther(mergeNationalities(nationalityRows), TOP_NATIONALITIES);

    return {
      range: { from: from ?? null, to: to ?? null },
      totals,
      signups: fillMonths(
        signupRows,
        (bucket) => ({ bucket, tenants: 0 }),
        from,
        to,
      ),
      funnel,
      age: bucketAges(ageRows),
      nationality,
      occupation: {
        base,
        items: withShares(occupationRows, base, OCCUPATION_LABELS),
        unknown: coverage.occupationUnknown,
      },
      familyStatus: {
        base,
        items: withShares(familyRows, base, FAMILY_STATUS_LABELS),
        unknown: coverage.familyStatusUnknown,
      },
      budget: bucketBudgets(budgetRows),
      areas: { items: areaRows, unknown: coverage.areasUnknown },
    };
  }
}
