import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Property } from "@/entities/property.entity";
import { Building } from "@/entities/building.entity";
import { S3Service } from "@/common/services/s3.service";
import { PropertyService } from "./property.service";
import { FindAdminPropertiesDto } from "./dto/find-admin-properties.dto";

/**
 * A stand-in for the TypeORM query builder that records every `andWhere`
 * clause and its parameters, so the tests can assert on the SQL the admin
 * list builds instead of on a database.
 */
const createQueryBuilderStub = (rows: Property[], total: number) => {
  const clauses: Array<{ sql: string; params?: Record<string, unknown> }> = [];
  const builder = {
    clauses,
    skipped: undefined as number | undefined,
    taken: undefined as number | undefined,
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn(function (this: void, value: number) {
      builder.skipped = value;
      return builder;
    }),
    take: jest.fn(function (this: void, value: number) {
      builder.taken = value;
      return builder;
    }),
    andWhere: jest.fn(function (
      this: void,
      sql: string,
      params?: Record<string, unknown>,
    ) {
      clauses.push({ sql, params });
      return builder;
    }),
    getManyAndCount: jest.fn().mockResolvedValue([rows, total]),
  };
  return builder;
};

describe("PropertyService admin list", () => {
  const buildService = async (rows: Property[] = [], total = 0) => {
    const builder = createQueryBuilderStub(rows, total);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: getRepositoryToken(Property),
          useValue: { createQueryBuilder: () => builder },
        },
        { provide: getRepositoryToken(Building), useValue: {} },
        {
          provide: S3Service,
          useValue: {
            refreshMediaUrls: jest.fn().mockResolvedValue(undefined),
            refreshUrl: jest.fn(async (url: string) => url),
          },
        },
      ],
    }).compile();

    return { service: moduleRef.get(PropertyService), builder };
  };

  const sqlOf = (builder: { clauses: Array<{ sql: string }> }) =>
    builder.clauses.map((clause) => clause.sql);

  it("defaults to the first page of 20 and reports the page count", async () => {
    const { service, builder } = await buildService([], 45);

    const page = await service.findAllWithFreshUrls();

    expect(builder.skipped).toBe(0);
    expect(builder.taken).toBe(20);
    expect(page).toMatchObject({ total: 45, page: 1, limit: 20, totalPages: 3 });
  });

  it("offsets by the requested page", async () => {
    const { service, builder } = await buildService([], 45);

    await service.findAllWithFreshUrls({
      page: "3",
      limit: "20",
    } as FindAdminPropertiesDto);

    expect(builder.skipped).toBe(40);
    expect(builder.taken).toBe(20);
  });

  it("falls back to the defaults for a nonsense page or an oversized limit", async () => {
    const { service, builder } = await buildService([], 0);

    const page = await service.findAllWithFreshUrls({
      page: "0",
      limit: "5000",
    } as FindAdminPropertiesDto);

    expect(builder.skipped).toBe(0);
    expect(page).toMatchObject({ page: 1, limit: 20 });
  });

  it("matches the search term against the title or the description", async () => {
    const { service, builder } = await buildService([], 0);

    await service.findAllWithFreshUrls({
      search: "  riverside  ",
    } as FindAdminPropertiesDto);

    const search = builder.clauses.find((clause) =>
      clause.sql.includes("ILIKE"),
    );
    expect(search?.sql).toBe(
      "(property.title ILIKE :search OR property.descriptions ILIKE :search)",
    );
    // Trimmed, and wrapped so it matches anywhere in the text.
    expect(search?.params).toEqual({ search: "%riverside%" });
  });

  it("leaves the search clause out for a blank term", async () => {
    const { service, builder } = await buildService([], 0);

    await service.findAllWithFreshUrls({
      search: "   ",
    } as FindAdminPropertiesDto);

    expect(sqlOf(builder)).toEqual([]);
  });

  it("filters on the landing flag, the type and the room counts together", async () => {
    const { service, builder } = await buildService([], 0);

    await service.findAllWithFreshUrls({
      is_landing_listing: "true",
      property_type: "apartment",
      bedrooms: "2",
      bathrooms_min: "3",
      search: "loft",
    } as FindAdminPropertiesDto);

    expect(sqlOf(builder)).toEqual([
      "property.is_landing_listing = :flagged",
      "property.property_type = :property_type",
      "property.bedrooms = :bedrooms",
      "property.bathrooms >= :bathrooms_min",
      "(property.title ILIKE :search OR property.descriptions ILIKE :search)",
    ]);
    expect(builder.clauses[0].params).toEqual({ flagged: true });
    expect(builder.clauses[2].params).toEqual({ bedrooms: 2 });
    expect(builder.clauses[3].params).toEqual({ bathrooms_min: 3 });
  });

  it("treats studio (0 bedrooms) as a filter, not as an absent one", async () => {
    const { service, builder } = await buildService([], 0);

    await service.findAllWithFreshUrls({
      bedrooms: "0",
    } as FindAdminPropertiesDto);

    expect(sqlOf(builder)).toEqual(["property.bedrooms = :bedrooms"]);
    expect(builder.clauses[0].params).toEqual({ bedrooms: 0 });
  });

  it("narrows to unflagged listings when the flag is sent as false", async () => {
    const { service, builder } = await buildService([], 0);

    await service.findAllWithFreshUrls({
      is_landing_listing: "false",
    } as FindAdminPropertiesDto);

    expect(builder.clauses[0].params).toEqual({ flagged: false });
  });

  it("scopes to a building and an operator", async () => {
    const { service, builder } = await buildService([], 0);

    await service.findAllWithFreshUrls({
      building_id: "11111111-1111-1111-1111-111111111111",
      operator_id: "22222222-2222-2222-2222-222222222222",
    } as FindAdminPropertiesDto);

    expect(sqlOf(builder)).toEqual([
      "property.building_id = :building_id",
      "property.operator_id = :operator_id",
    ]);
  });
});
