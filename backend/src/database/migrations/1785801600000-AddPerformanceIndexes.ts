import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Step 6.1 — indexes on the foreign keys and on the columns the matching and
 * catalogue read paths actually filter and sort by. Behaviour does not change;
 * only the plans do.
 *
 * Postgres creates an index for PRIMARY KEY and UNIQUE constraints but never
 * for a FOREIGN KEY, so every FK below was unindexed. All of them are
 * `ON DELETE CASCADE`, which makes the gap worse than a slow join: deleting a
 * user or a building has to scan the whole child table for each row it
 * cascades into.
 *
 * Columns deliberately left out, having been checked against the code rather
 * than against the plan:
 *   - `properties.bathrooms` and `properties.furnishing` — the plan lists them,
 *     but neither ever reaches SQL. They are read by the JS scoring engine in
 *     `matching-calculation.service.ts` after the rows have been fetched.
 *   - `booking_requests.tenant_id`, `shortlist."userId"`, `preferences.user_id`,
 *     `tenant_cvs.user_id`, `tenant_profiles."userId"`,
 *     `operator_profiles."userId"` — already served by a UNIQUE constraint, or
 *     by being the leading column of a composite unique index.
 *
 * `property_type` gets an expression index rather than a plain one: the filter
 * is `LOWER(property.property_type) IN (...)`, which a plain btree on the raw
 * column cannot serve.
 *
 * ---
 * NOT TRANSACTIONAL, on purpose.
 *
 * `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block, and it is
 * what keeps production writeable while the index is built. `transaction =
 * false` requires `migrationsTransactionMode` to be "each" or "none" — the
 * data source sets "each" for exactly this reason.
 *
 * Consequence for the operator: because there is no transaction, a failure
 * part-way through leaves the indexes created so far in place. Every statement
 * is `IF NOT EXISTS`, so re-running is safe and picks up where it stopped.
 *
 * One caveat that `IF NOT EXISTS` does not cover: if a concurrent build is
 * interrupted, Postgres leaves an INVALID index behind, and a re-run will see
 * it exist and skip it. After a failed run, check for leftovers with
 *
 *   SELECT i.relname FROM pg_index x
 *   JOIN pg_class i ON i.oid = x.indexrelid
 *   WHERE NOT x.indisvalid;
 *
 * and drop anything it lists before running again.
 *
 * Reverting needs an extra flag. TypeORM honours `transaction = false` when it
 * runs a migration but not when it reverts one: `undoLastMigration` opens a
 * transaction whenever the mode is anything other than "none", without
 * consulting the migration. So `npm run mig:revert` fails here with
 * "DROP INDEX CONCURRENTLY cannot run inside a transaction block". Use
 * `npm run mig:revert:notx` (or `mig:revert:prod:notx`), which passes
 * `-t none`; both were added for this migration and are verified against it.
 */
export class AddPerformanceIndexes1785801600000 implements MigrationInterface {
  name = "AddPerformanceIndexes1785801600000";

  /** `CREATE INDEX CONCURRENTLY` is illegal inside a transaction block. */
  transaction = false;

  private readonly indexes: Array<{ name: string; definition: string }> = [
    // --- Foreign keys -----------------------------------------------------
    {
      name: "idx_properties_building_id",
      definition: `"properties" ("building_id")`,
    },
    {
      name: "idx_properties_operator_id",
      definition: `"properties" ("operator_id")`,
    },
    {
      name: "idx_property_media_property_id",
      definition: `"property_media" ("property_id")`,
    },
    {
      // The composite UNIQUE (tenant_id, property_id) only serves lookups that
      // lead with tenant_id; "requests for this property" still scans.
      name: "idx_booking_requests_property_id",
      definition: `"booking_requests" ("property_id")`,
    },
    {
      // Same shape as above against unique_user_property ("userId","propertyId").
      name: "idx_shortlist_property_id",
      definition: `"shortlist" ("propertyId")`,
    },
    {
      name: "idx_buildings_operator_id",
      definition: `"buildings" ("operator_id")`,
    },

    // --- Matching pre-filters and catalogue ordering ----------------------
    // `applyPreFilters` in matching.service.ts filters on price and bedrooms;
    // property.service.ts filters the public catalogue on building_id and
    // operator_id (above) and orders every listing by created_at.
    {
      name: "idx_properties_price",
      definition: `"properties" ("price")`,
    },
    {
      name: "idx_properties_bedrooms",
      definition: `"properties" ("bedrooms")`,
    },
    {
      name: "idx_properties_property_type_lower",
      definition: `"properties" (LOWER("property_type"))`,
    },
    {
      // Plain ascending: a btree is scanned backwards for ORDER BY … DESC at no
      // cost, and keeping it unordered is what lets the entity's @Index carry
      // the same definition.
      name: "idx_properties_created_at",
      definition: `"properties" ("created_at")`,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { name, definition } of this.indexes) {
      await queryRunner.query(
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${name}" ON ${definition}`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { name } of [...this.indexes].reverse()) {
      await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${name}"`);
    }
  }
}
