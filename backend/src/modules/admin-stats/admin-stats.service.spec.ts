import { DataSource } from "typeorm";

import { AdminStatsService } from "./admin-stats.service";

/**
 * The SQL itself needs Postgres; this pins what the service promises around
 * it: one round of concurrent aggregate queries sharing the same bound range,
 * and the rows they return shaped into the response bundle.
 */
function createDataSourceDouble() {
  // Results in the order the service issues its queries.
  const results: unknown[][] = [
    [{ tenants: 10, operators: 3, newThisPeriod: 4 }],
    [{ bucket: "2026-07", tenants: 1, operators: 0 }, { bucket: "2026-09", tenants: 2, operators: 1 }],
    [{ role: "operator", count: 1 }, { role: "tenant", count: 3 }],
    [{ tenants: 3, withPreferences: 2, cvCompleted: 1, cvShared: 1 }],
    [{ age: 29, count: 2 }, { age: null, count: 1 }],
    [{ value: "United Kingdom", count: 2 }, { value: null, count: 1 }],
    [{ withPreferences: 2, occupationUnknown: 0, familyStatusUnknown: 1, areasUnknown: 1 }],
    [{ value: "student", count: 1 }, { value: "young-professional", count: 2 }],
    [{ value: "couple", count: 1 }],
    [{ price: 1800, count: 1 }, { price: null, count: 1 }],
    [{ value: "Camden", count: 1 }],
  ];
  let call = 0;
  const query = jest.fn(async () => results[call++]);
  return { dataSource: { query } as unknown as DataSource, query, queryCount: results.length };
}

describe("AdminStatsService.getStats", () => {
  it("binds the same range to every query and aggregates in SQL", async () => {
    const { dataSource, query, queryCount } = createDataSourceDouble();

    await new AdminStatsService(dataSource).getStats("2026-07-01", "2026-09-30");

    expect(query).toHaveBeenCalledTimes(queryCount);
    for (const [sql, params] of query.mock.calls as unknown as Array<[string, unknown[]]>) {
      expect(params).toEqual(["2026-07-01", "2026-09-30"]);
      expect(sql).toMatch(/COUNT\(/);
      expect(sql).not.toMatch(/SELECT \*/);
    }
  });

  it("passes null bounds for an open range", async () => {
    const { dataSource, query } = createDataSourceDouble();

    await new AdminStatsService(dataSource).getStats();

    expect(query.mock.calls[0]).toEqual([expect.any(String), [null, null]]);
  });

  it("shapes the rows into the bundle", async () => {
    const { dataSource } = createDataSourceDouble();

    const stats = await new AdminStatsService(dataSource).getStats("2026-07-01", "2026-09-30");

    expect(stats.range).toEqual({ from: "2026-07-01", to: "2026-09-30" });
    expect(stats.totals).toEqual({ tenants: 10, operators: 3, newThisPeriod: 4 });
    expect(stats.signups.map((s) => s.bucket)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(stats.funnel.cvCompleted).toBe(1);
    expect(stats.age.unknown).toBe(1);
    expect(stats.age.groups.find((g) => g.group === "25-34")?.count).toBe(2);
    expect(stats.nationality).toEqual({
      items: [{ value: "United Kingdom", count: 2 }],
      other: 0,
      unknown: 1,
    });
    expect(stats.occupation.base).toBe(2);
    expect(stats.occupation.items[0]).toEqual({
      value: "young-professional",
      label: "Young professional",
      count: 2,
      pctOfTenants: 100,
    });
    expect(stats.familyStatus.unknown).toBe(1);
    expect(stats.budget.unknown).toBe(1);
    expect(stats.budget.buckets.find((b) => b.bucket === "£1,500-1,999")?.count).toBe(1);
    expect(stats.areas).toEqual({ items: [{ value: "Camden", count: 1 }], unknown: 1 });
  });
});
