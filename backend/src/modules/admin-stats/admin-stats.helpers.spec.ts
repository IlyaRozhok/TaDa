import {
  FAMILY_STATUS_LABELS,
  OCCUPATION_LABELS,
  UNDER_18_GROUP,
  bucketAges,
  bucketBudgets,
  fillMonths,
  labelFor,
  topNWithOther,
  withShares,
} from "./admin-stats.helpers";

describe("bucketAges", () => {
  it("folds ages into the fixed groups at their boundaries", () => {
    const { groups, unknown } = bucketAges([
      { age: 18, count: 1 },
      { age: 24, count: 2 },
      { age: 25, count: 3 },
      { age: 34, count: 1 },
      { age: 35, count: 1 },
      { age: 54, count: 4 },
      { age: 55, count: 2 },
      { age: 90, count: 1 },
    ]);

    expect(groups).toEqual([
      { group: "18-24", count: 3 },
      { group: "25-34", count: 4 },
      { group: "35-44", count: 1 },
      { group: "45-54", count: 4 },
      { group: "55+", count: 3 },
    ]);
    expect(unknown).toBe(0);
  });

  it("counts a missing date of birth as unknown", () => {
    const { groups, unknown } = bucketAges([
      { age: null, count: 7 },
      { age: 30, count: 1 },
    ]);

    expect(unknown).toBe(7);
    expect(groups.find((g) => g.group === "25-34")?.count).toBe(1);
  });

  it("adds an under-18 group only when someone falls into it", () => {
    expect(bucketAges([{ age: 30, count: 1 }]).groups.map((g) => g.group)).not.toContain(
      UNDER_18_GROUP,
    );
    expect(bucketAges([{ age: 16, count: 2 }]).groups[0]).toEqual({
      group: UNDER_18_GROUP,
      count: 2,
    });
  });
});

describe("bucketBudgets", () => {
  it("folds prices into the buckets and nulls into unknown", () => {
    const { buckets, unknown } = bucketBudgets([
      { price: 800, count: 1 },
      { price: 1000, count: 2 },
      { price: 1499, count: 1 },
      { price: 3999, count: 1 },
      { price: 4000, count: 3 },
      { price: null, count: 5 },
    ]);

    expect(buckets.map((b) => b.count)).toEqual([1, 3, 0, 0, 0, 1, 3]);
    expect(unknown).toBe(5);
  });
});

describe("topNWithOther", () => {
  it("keeps the largest values, folds the rest into other, blanks into unknown", () => {
    const result = topNWithOther(
      [
        { value: "France", count: 2 },
        { value: "United Kingdom", count: 9 },
        { value: "Spain", count: 2 },
        { value: "Italy", count: 1 },
        { value: null, count: 4 },
        { value: "  ", count: 1 },
      ],
      2,
    );

    expect(result.items).toEqual([
      { value: "United Kingdom", count: 9 },
      { value: "France", count: 2 },
    ]);
    expect(result.other).toBe(3);
    expect(result.unknown).toBe(5);
  });
});

describe("labelFor", () => {
  it("uses the mapped label", () => {
    expect(labelFor("young-professional", OCCUPATION_LABELS)).toBe("Young professional");
    expect(labelFor("friends-flatmates", FAMILY_STATUS_LABELS)).toBe("Friends / flatmates");
  });

  it("makes an unmapped slug readable", () => {
    expect(labelFor("digital-nomad", OCCUPATION_LABELS)).toBe("Digital nomad");
  });
});

describe("withShares", () => {
  it("computes shares of the base, sorted by count, with labels", () => {
    const rows = withShares(
      [
        { value: "student", count: 1 },
        { value: "young-professional", count: 3 },
        { value: null, count: 9 },
      ],
      4,
      OCCUPATION_LABELS,
    );

    expect(rows).toEqual([
      { value: "young-professional", label: "Young professional", count: 3, pctOfTenants: 75 },
      { value: "student", label: "Student", count: 1, pctOfTenants: 25 },
    ]);
  });

  it("returns 0% rather than dividing by zero", () => {
    expect(withShares([{ value: "student", count: 1 }], 0, OCCUPATION_LABELS)[0].pctOfTenants).toBe(0);
  });
});

describe("fillMonths", () => {
  const empty = (bucket: string) => ({ bucket, n: 0 });

  it("fills the gaps between the first and last month", () => {
    const filled = fillMonths([{ bucket: "2026-11", n: 1 }, { bucket: "2027-02", n: 2 }], empty);

    expect(filled.map((r) => r.bucket)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
    expect(filled.map((r) => r.n)).toEqual([1, 0, 0, 2]);
  });

  it("extends to the requested range", () => {
    const filled = fillMonths([{ bucket: "2026-08", n: 1 }], empty, "2026-06-15", "2026-09-30");

    expect(filled.map((r) => r.bucket)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09"]);
  });

  it("returns nothing when there are no rows and no range", () => {
    expect(fillMonths([], empty)).toEqual([]);
  });
});
