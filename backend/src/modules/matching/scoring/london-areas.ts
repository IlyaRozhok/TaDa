/**
 * London regions and the boroughs they contain.
 *
 * ⚠️ MIRRORS `frontend/src/constants/admin-form-options.ts` (`AREA_OPTIONS` and
 * `DISTRICTS_BY_AREA`) — the lists the preferences wizard offers a tenant. The
 * two must stay 1:1: the frontend decides what a tenant can store in
 * `preferred_areas` / `preferred_districts`, and this decides what the scorer
 * makes of it. A borough added there and not here silently stops matching by
 * area. There is no shared package between the two apps to hold it once; the
 * duplication is recorded in docs/STATUS.md.
 *
 * Borough names are the ONS/postcodes.io `admin_district` spellings, which is
 * what `GeocodingService` writes into `property.borough`.
 */
export const DISTRICTS_BY_AREA: ReadonlyArray<{
  area: string;
  districts: readonly string[];
}> = [
  {
    area: "Central London",
    districts: [
      "Camden",
      "Westminster",
      "Kensington and Chelsea",
      "Islington",
      "Lambeth",
      "Southwark",
    ],
  },
  {
    area: "North London",
    districts: ["Barnet", "Enfield", "Haringey", "Camden", "Islington"],
  },
  {
    area: "East London",
    districts: [
      "Hackney",
      "Tower Hamlets",
      "Newham",
      "Barking and Dagenham",
      "Waltham Forest",
      "Redbridge",
      "Havering",
    ],
  },
  {
    area: "South London",
    districts: [
      "Lambeth",
      "Southwark",
      "Lewisham",
      "Greenwich",
      "Wandsworth",
      "Croydon",
      "Bromley",
      "Merton",
      "Kingston upon Thames",
    ],
  },
  {
    area: "West London",
    districts: [
      "Hammersmith and Fulham",
      "Ealing",
      "Hounslow",
      "Brent",
      "Hillingdon",
      "Kensington and Chelsea",
      "Richmond upon Thames",
    ],
  },
];

/**
 * Compare form for an area name.
 *
 * The wizard stores the full option ("East London"), but older rows — and the
 * entity's own ApiProperty example — carry the bare region ("East"). Both name
 * the same place, so the trailing "London" is dropped before comparing.
 */
function normalizeAreaName(area: string): string {
  return area
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+london$/, "");
}

const BOROUGHS_BY_NORMALIZED_AREA: ReadonlyMap<
  string,
  ReadonlySet<string>
> = new Map(
  DISTRICTS_BY_AREA.map(({ area, districts }) => [
    normalizeAreaName(area),
    new Set(districts.map((district) => district.toLowerCase())),
  ]),
);

/**
 * The boroughs of a preferred area, lowercased, or `null` when the string does
 * not name an area this map knows.
 */
export function getBoroughsForArea(area: string): ReadonlySet<string> | null {
  return BOROUGHS_BY_NORMALIZED_AREA.get(normalizeAreaName(area)) ?? null;
}
