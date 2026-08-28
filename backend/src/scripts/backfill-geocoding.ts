/**
 * One-off backfill: geocode every property that has an address but no
 * postcode yet (package B2 introduced the columns; writes since then are
 * geocoded on save, rows from before stay null until edited — or until this
 * script runs).
 *
 *   npm run geo:backfill        # locally in backend/, with the real .env
 *   npm run geo:backfill:prod   # on a host, inside the backend container
 *
 * It lives under src/ so `tsc` compiles it into dist/scripts/ — the prod
 * image ships dist/ and prod deps only (no ts-node), so the deployed
 * container can run the backfill the same way it runs migrations.
 *
 * Idempotent and resumable: it only touches rows with a NULL postcode, so a
 * re-run picks up where it stopped. Rows whose address contains no full UK
 * postcode are counted and left as they are — they cannot be geocoded.
 * Throttled to ~8 req/s to stay polite to postcodes.io.
 */
import dataSource from "../database/data-source";
import { GeocodingService } from "../common/services/geocoding.service";
import { Property } from "../entities/property.entity";

const THROTTLE_MS = 120;

async function main(): Promise<void> {
  await dataSource.initialize();
  const repository = dataSource.getRepository(Property);
  const geocoder = new GeocodingService();

  const rows: Array<Pick<Property, "id" | "address">> = await repository
    .createQueryBuilder("property")
    .select(["property.id", "property.address"])
    .where("property.address IS NOT NULL AND property.postcode IS NULL")
    .getMany();

  let geocoded = 0;
  let unresolvable = 0;

  for (const row of rows) {
    const geo = await geocoder.lookupPostcode(row.address);
    if (!geo) {
      unresolvable += 1;
      continue;
    }
    await repository.update(row.id, {
      postcode: geo.postcode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      borough: geo.borough,
    });
    geocoded += 1;
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
  }

  console.log(
    `Geocoding backfill: ${rows.length} candidates, ${geocoded} geocoded, ` +
      `${unresolvable} without a resolvable postcode in the address.`,
  );
  await dataSource.destroy();
}

main().catch((error) => {
  console.error("Geocoding backfill failed:", error);
  process.exitCode = 1;
});
