import { NotFoundException } from "@nestjs/common";
import { IsNull } from "typeorm";
import { Building } from "@/entities/building.entity";
import { Property, PropertyStatus } from "@/entities/property.entity";
import { UserRole } from "@/entities/user.entity";
import { BuildingService } from "@/modules/building/building.service";
import { PropertyService } from "./property.service";
import {
  isPubliclyVisible,
  PUBLICLY_VISIBLE_SQL,
  publiclyVisibleWhere,
} from "./property.visibility";

const property = (overrides: Partial<Property> = {}) =>
  ({
    id: "p-1",
    status: PropertyStatus.Listed,
    is_visible: true,
    building: null,
    photos: [],
    ...overrides,
  }) as unknown as Property;

const hiddenBuilding = { id: "b-1", is_visible: false } as Building;
const visibleBuilding = { id: "b-1", is_visible: true } as Building;

describe("effective visibility", () => {
  it("needs the property's own flag and, if it has one, its building's", () => {
    expect(isPubliclyVisible(property())).toBe(true);
    expect(isPubliclyVisible(property({ building: visibleBuilding }))).toBe(true);
    expect(isPubliclyVisible(property({ is_visible: false }))).toBe(false);
    expect(isPubliclyVisible(property({ building: hiddenBuilding }))).toBe(false);
    expect(isPubliclyVisible(property({ is_visible: false, building: visibleBuilding }))).toBe(false);
  });

  it("expresses the same rule for find options", () => {
    expect(publiclyVisibleWhere({ id: "p-1" })).toEqual([
      { id: "p-1", is_visible: true, building_id: IsNull() },
      { id: "p-1", is_visible: true, building: { is_visible: true } },
    ]);
  });

  it("expresses the same rule in SQL, without needing a join on the building", () => {
    expect(PUBLICLY_VISIBLE_SQL).toContain("property.is_visible = true");
    expect(PUBLICLY_VISIBLE_SQL).toContain("NOT EXISTS");
    expect(PUBLICLY_VISIBLE_SQL).toContain("visibility_building.is_visible = false");
  });
});

describe("PropertyService visibility", () => {
  const build = (repository: Record<string, unknown>) =>
    new PropertyService(
      repository as any,
      {} as any,
      { refreshMediaUrls: jest.fn().mockResolvedValue(undefined), refreshUrl: jest.fn(async (u: string) => u) } as any,
      {} as any,
    );

  const stubBuilder = () => {
    const clauses: string[] = [];
    const builder: Record<string, jest.Mock> = {};
    for (const method of ["leftJoinAndSelect", "addSelect", "orderBy", "skip", "take"]) {
      builder[method] = jest.fn(() => builder);
    }
    for (const method of ["where", "andWhere"]) {
      builder[method] = jest.fn((sql: string) => {
        clauses.push(sql);
        return builder;
      });
    }
    builder.getCount = jest.fn().mockResolvedValue(0);
    builder.getMany = jest.fn().mockResolvedValue([]);
    return { builder, clauses };
  };

  it("filters the public catalogue", async () => {
    const { builder, clauses } = stubBuilder();
    await build({ createQueryBuilder: () => builder }).findAllPublic();
    expect(clauses).toContain(PUBLICLY_VISIBLE_SQL);
  });

  it("filters the landing listings", async () => {
    const { builder, clauses } = stubBuilder();
    await build({ createQueryBuilder: () => builder }).findLandingListings();
    expect(clauses).toContain(PUBLICLY_VISIBLE_SQL);
  });

  it.each([
    ["hidden itself", { is_visible: false }],
    ["hidden through its building", { building: hiddenBuilding }],
  ])("answers 404 on the public detail of a property %s", async (_name, overrides) => {
    const service = build({ findOne: jest.fn().mockResolvedValue(property(overrides)) });
    await expect(service.findOnePublic("p-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("still serves a visible property on the public detail", async () => {
    const service = build({ findOne: jest.fn().mockResolvedValue(property({ building: visibleBuilding })) });
    await expect(service.findOnePublic("p-1")).resolves.toMatchObject({ id: "p-1" });
  });

  it("lets only an admin set the flag: an operator's is dropped from the payload", () => {
    const strip = (build({}) as any).stripAdminOnlyFields.bind(build({}));
    const dto = { title: "T", is_visible: false, is_landing_listing: true };

    expect(strip(dto, UserRole.Admin)).toEqual(dto);
    expect(strip(dto, UserRole.Operator)).toEqual({ title: "T" });
  });
});

describe("BuildingService visibility", () => {
  const build = (findOne: jest.Mock) =>
    new BuildingService(
      { findOne } as any,
      {} as any,
      {} as any,
      { refreshMediaUrls: jest.fn(async (entity: unknown) => entity) } as any,
      {} as any,
    );

  it("answers 404 on the public detail of a hidden building", async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    await expect(build(findOne).findOnePublic("b-1")).rejects.toBeInstanceOf(NotFoundException);
    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "b-1", is_visible: true } }));
  });
});
