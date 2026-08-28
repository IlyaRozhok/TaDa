import { Logger } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Property, PropertyStatus } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { S3Service } from "@/common/services/s3.service";
import { MatchingCalculationService } from "./services/matching-calculation.service";
import { MatchingService, averageMatchPercentage } from "./matching.service";

/**
 * The aggregate reported beside `total` on the matched-properties envelope.
 * It describes the whole matched set, so the cases that matter are the ones
 * where "no data" and "a score of zero" could be confused.
 */
describe("averageMatchPercentage", () => {
  it("averages the whole set and keeps one decimal", () => {
    expect(
      averageMatchPercentage([
        { matchPercentage: 80 },
        { matchPercentage: 71 },
        { matchPercentage: 62 },
      ]),
    ).toBe(71);

    expect(
      averageMatchPercentage([
        { matchPercentage: 80 },
        { matchPercentage: 75 },
        { matchPercentage: 71 },
      ]),
    ).toBe(75.3);
  });

  it("rounds half up, as the frontend did before the server owned this", () => {
    expect(
      averageMatchPercentage([
        { matchPercentage: 10.05 },
        { matchPercentage: 10.05 },
      ]),
    ).toBe(10.1);
  });

  it("returns null for an empty set rather than a mean of zero", () => {
    expect(averageMatchPercentage([])).toBeNull();
  });

  it("reports a genuine zero as zero", () => {
    expect(
      averageMatchPercentage([{ matchPercentage: 0 }, { matchPercentage: 0 }]),
    ).toBe(0);
  });
});

/**
 * A stand-in for the TypeORM query builder that records the SQL the feed
 * builds — the `andWhere` clauses and, above all, the ORDER BY — so the tests
 * assert on the query instead of on a database.
 */
type QueryBuilderStub = ReturnType<typeof createQueryBuilderStub>;

const createQueryBuilderStub = (rows: Partial<Property>[], total: number) => {
  const clauses: Array<{ sql: string; params?: Record<string, unknown> }> = [];
  const orderings: Array<{
    column: string;
    direction?: string;
    nulls?: string;
  }> = [];

  const builder = {
    clauses,
    orderings,
    skipped: undefined as number | undefined,
    taken: undefined as number | undefined,
    selected: undefined as string[] | undefined,
    select: jest.fn(function (columns: string[]) {
      builder.selected = columns;
      return builder;
    }),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    whereInIds: jest.fn().mockReturnThis(),
    where: jest.fn(function (
      sql: string,
      params?: Record<string, unknown>,
    ) {
      clauses.push({ sql, params });
      return builder;
    }),
    andWhere: jest.fn(function (
      sql: string,
      params?: Record<string, unknown>,
    ) {
      clauses.push({ sql, params });
      return builder;
    }),
    orderBy: jest.fn(function (
      column: string,
      direction?: string,
      nulls?: string,
    ) {
      // The real builder REPLACES the order on `orderBy`, so the stub must too
      // — otherwise a fallback ordering would look like a tie-break.
      orderings.length = 0;
      orderings.push({ column, direction, nulls });
      return builder;
    }),
    addOrderBy: jest.fn(function (
      column: string,
      direction?: string,
      nulls?: string,
    ) {
      orderings.push({ column, direction, nulls });
      return builder;
    }),
    skip: jest.fn(function (value: number) {
      builder.skipped = value;
      return builder;
    }),
    take: jest.fn(function (value: number) {
      builder.taken = value;
      return builder;
    }),
    getCount: jest.fn().mockResolvedValue(total),
    getMany: jest.fn().mockResolvedValue(rows),
  };

  return builder;
};

const listedProperty = (
  id: string,
  overrides: Partial<Property> = {},
): Partial<Property> => ({
  id,
  status: PropertyStatus.Listed,
  created_at: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

/**
 * Build the service over a queue of query-builder stubs — one per
 * `createQueryBuilder` call the request makes, in order. The feed makes at
 * most two: the one that chooses the page's ids, then the hydration.
 */
const buildService = async (options: {
  builders: QueryBuilderStub[];
  preferences: Partial<Preferences> | null;
  /** Score returned for a property id; anything unlisted scores 0. */
  scoreById?: Record<string, number>;
}) => {
  const queue = [...options.builders];
  const calculateMatch = jest.fn((property: Property) => ({
    property,
    totalScore: 0,
    maxPossibleScore: 100,
    matchPercentage: options.scoreById?.[property.id] ?? 0,
    isPerfectMatch: false,
    categories: [
      {
        category: "budget",
        match: true,
        score: 18,
        maxScore: 18,
        reason: "within budget",
        hasPreference: true,
      },
    ],
    summary: { matched: 1, partial: 0, notMatched: 0, skipped: 0 },
  }));

  const moduleRef = await Test.createTestingModule({
    providers: [
      MatchingService,
      {
        provide: getRepositoryToken(Property),
        useValue: {
          createQueryBuilder: jest.fn(() => {
            const next = queue.shift();
            if (!next) {
              throw new Error("createQueryBuilder called more times than stubbed");
            }
            return next;
          }),
        },
      },
      {
        provide: getRepositoryToken(Preferences),
        useValue: { findOne: jest.fn().mockResolvedValue(options.preferences) },
      },
      {
        provide: MatchingCalculationService,
        useValue: { calculateMatch },
      },
      {
        provide: S3Service,
        useValue: {
          refreshMediaUrls: jest.fn(async (property: Property) => property),
        },
      },
    ],
  }).compile();

  return { service: moduleRef.get(MatchingService), calculateMatch };
};

const preferences: Partial<Preferences> = {
  user_id: "tenant-1",
  min_price: 1500,
  max_price: 2000,
  updated_at: new Date("2026-08-01T00:00:00Z"),
};

const sqlOf = (builder: QueryBuilderStub) =>
  builder.clauses.map((clause) => clause.sql).join(" ");

describe("MatchingService feed — the full listed inventory", () => {
  describe("best_match", () => {
    it("ranks the whole listed inventory by default, without pre-filtering it", async () => {
      const candidates = [
        listedProperty("a"),
        listedProperty("b"),
        listedProperty("c"),
      ];
      const ranking = createQueryBuilderStub(candidates, 0);
      const hydration = createQueryBuilderStub([listedProperty("b")], 0);

      const { service } = await buildService({
        builders: [ranking, hydration],
        preferences,
        // `c` is a poor match. It stays in the feed at its real percentage.
        scoreById: { a: 40, b: 91, c: 3 },
      });

      const result = await service.getMatchedPropertiesWithPagination(
        "tenant-1",
        { page: 1, limit: 1 },
      );

      // The only predicate is the lifecycle status: no budget, bedroom or
      // property-type narrowing was applied.
      expect(sqlOf(ranking)).toContain("property.status = :listedStatus");
      expect(sqlOf(ranking)).not.toContain("property.price");
      expect(sqlOf(ranking)).not.toContain("property.bedrooms");
      expect(sqlOf(ranking)).not.toContain("property.property_type");

      // `total` is the full listed count, not the count of good matches.
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(3);
      // Best match first, poor matches sunk rather than dropped.
      expect(result.data[0].property.id).toBe("b");
      expect(result.data[0].matchScore).toBe(91);
      expect(result.avgMatchScore).toBe(44.7);
    });

    it("narrows in SQL only when prefilters are explicitly opted into", async () => {
      const ranking = createQueryBuilderStub([listedProperty("a")], 0);
      const hydration = createQueryBuilderStub([listedProperty("a")], 0);

      const { service } = await buildService({
        builders: [ranking, hydration],
        preferences,
        scoreById: { a: 55 },
      });

      await service.getMatchedPropertiesWithPagination("tenant-1", {
        prefilters: true,
      });

      expect(sqlOf(ranking)).toContain("property.price <= :upperBound");
      expect(sqlOf(ranking)).toContain("property.price >= :lowerBound");
    });

    it("warns when the ranking pass fills the candidate ceiling", async () => {
      const candidates = Array.from({ length: 5000 }, (_, index) =>
        listedProperty(`p-${index}`),
      );
      const ranking = createQueryBuilderStub(candidates, 0);
      const hydration = createQueryBuilderStub([], 0);

      const { service } = await buildService({
        builders: [ranking, hydration],
        preferences,
      });

      const warn = jest
        .spyOn(Logger.prototype, "warn")
        .mockImplementation(() => undefined);

      await service.getMatchedPropertiesWithPagination("tenant-1", {});

      expect(
        warn.mock.calls.some((call) =>
          String(call[0]).includes("5000-candidate ceiling"),
        ),
      ).toBe(true);

      warn.mockRestore();
    });

    it("does not warn below the ceiling", async () => {
      const ranking = createQueryBuilderStub([listedProperty("a")], 0);
      const hydration = createQueryBuilderStub([listedProperty("a")], 0);

      const { service } = await buildService({
        builders: [ranking, hydration],
        preferences,
        scoreById: { a: 12 },
      });

      const warn = jest
        .spyOn(Logger.prototype, "warn")
        .mockImplementation(() => undefined);

      await service.getMatchedPropertiesWithPagination("tenant-1", {});

      expect(warn).not.toHaveBeenCalled();

      warn.mockRestore();
    });
  });

  describe("server-side sorts", () => {
    const cases: Array<{
      sort: "low_price" | "high_price" | "low_deposit" | "high_deposit";
      column: string;
      direction: string;
    }> = [
      { sort: "low_price", column: "property.price", direction: "ASC" },
      { sort: "high_price", column: "property.price", direction: "DESC" },
      { sort: "low_deposit", column: "property.deposit", direction: "ASC" },
      { sort: "high_deposit", column: "property.deposit", direction: "DESC" },
    ];

    it.each(cases)(
      "$sort orders by $column $direction with a created_at tie-break",
      async ({ sort, column, direction }) => {
        const pageQuery = createQueryBuilderStub([listedProperty("a")], 87);
        const hydration = createQueryBuilderStub([listedProperty("a")], 0);

        const { service, calculateMatch } = await buildService({
          builders: [pageQuery, hydration],
          preferences,
          scoreById: { a: 64 },
        });

        const result = await service.getMatchedPropertiesWithPagination(
          "tenant-1",
          { page: 2, limit: 12, sort },
        );

        expect(pageQuery.orderings).toEqual([
          { column, direction, nulls: "NULLS LAST" },
          { column: "property.created_at", direction: "DESC", nulls: undefined },
        ]);
        expect(pageQuery.skipped).toBe(12);
        expect(pageQuery.taken).toBe(12);

        // `total` is the full listed count for the filter, from SQL.
        expect(result.total).toBe(87);
        // Only the page was scored — the TypeScript ranking pass is skipped.
        expect(calculateMatch).toHaveBeenCalledTimes(1);
        // …and the badge is still real.
        expect(result.data[0].matchScore).toBe(64);
        expect(result.data[0].categories).toHaveLength(1);
        // The set-level mean is not knowable without scoring the set.
        expect(result.avgMatchScore).toBeNull();
      },
    );

    it("date_added orders by created_at alone, with no duplicate tie-break", async () => {
      const pageQuery = createQueryBuilderStub([listedProperty("a")], 4);
      const hydration = createQueryBuilderStub([listedProperty("a")], 0);

      const { service } = await buildService({
        builders: [pageQuery, hydration],
        preferences,
        scoreById: { a: 30 },
      });

      await service.getMatchedPropertiesWithPagination("tenant-1", {
        sort: "date_added",
      });

      expect(pageQuery.orderings).toEqual([
        {
          column: "property.created_at",
          direction: "DESC",
          nulls: "NULLS LAST",
        },
      ]);
    });

    it("sorts the full listed inventory, not a pre-filtered slice", async () => {
      const pageQuery = createQueryBuilderStub([listedProperty("a")], 120);
      const hydration = createQueryBuilderStub([listedProperty("a")], 0);

      const { service } = await buildService({
        builders: [pageQuery, hydration],
        preferences,
        scoreById: { a: 1 },
      });

      await service.getMatchedPropertiesWithPagination("tenant-1", {
        sort: "low_price",
      });

      expect(sqlOf(pageQuery)).toContain("property.status = :listedStatus");
      expect(sqlOf(pageQuery)).not.toContain(":upperBound");
    });
  });

  describe("a user with no preferences", () => {
    it("honours the sort instead of always returning newest first", async () => {
      const pageQuery = createQueryBuilderStub([listedProperty("a")], 9);

      const { service } = await buildService({
        builders: [pageQuery],
        preferences: null,
      });

      const result = await service.getMatchedPropertiesWithPagination(
        "tenant-1",
        { sort: "high_price" },
      );

      expect(pageQuery.orderings).toEqual([
        { column: "property.price", direction: "DESC", nulls: "NULLS LAST" },
        { column: "property.created_at", direction: "DESC", nulls: undefined },
      ]);
      expect(result.total).toBe(9);
      expect(result.data[0].matchScore).toBe(0);
      expect(result.avgMatchScore).toBeNull();
    });

    it("falls back to newest first under best_match, as it always has", async () => {
      const pageQuery = createQueryBuilderStub([listedProperty("a")], 9);

      const { service } = await buildService({
        builders: [pageQuery],
        preferences: null,
      });

      await service.getMatchedPropertiesWithPagination("tenant-1", {});

      expect(pageQuery.orderings).toEqual([
        {
          column: "property.created_at",
          direction: "DESC",
          nulls: undefined,
        },
      ]);
    });
  });
});
