import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Step 6.6 — retire TypeORM's `simple-array` (R18).
 *
 * `simple-array` is not a Postgres type. TypeORM stores it in a plain `text`
 * column as the elements joined by "," and splits that string back apart on
 * read. Six columns still used it while their neighbours in the same tables
 * were already `jsonb`.
 *
 * Two of the six carry real data and are CONVERTED; four were only ever
 * written as `[]` at profile creation and never read, so they are DROPPED
 * rather than migrated — see the disposition table below.
 *
 * ---
 * CONVERSION IS PARITY-EXACT, ON PURPOSE.
 *
 * The conversion expression reproduces `DateUtils.stringToSimpleArray` exactly,
 * which is what the application has been reading all along:
 *
 *   if (typeof value === "string") return value.length > 0 ? value.split(",") : [];
 *   return value;   // null stays null
 *
 * `to_jsonb(string_to_array(col, ','))` matches it on every case:
 *
 *   'a,b'            -> ["a", "b"]          ''    -> []
 *   NULL             -> NULL                ','   -> ["", ""]
 *   'Active, Social' -> ["Active", " Social"]
 *
 * Note the last one: NO trimming and NO dropping of empty elements. Both would
 * be an improvement in the abstract and a silent data change here — the values
 * with the leading space are what the code compares against today. NULL is
 * likewise preserved rather than normalised to `[]`; every read site does
 * `|| []`, so the JS result is identical either way, and keeping NULL is what
 * makes `down()` an exact inverse.
 *
 * A value that itself contained a comma was already split in two on read,
 * before this migration — `simple-array` has no escaping. That damage is not
 * recoverable here and reproducing it faithfully is the only correct choice;
 * "repairing" it would invent data that was never stored.
 *
 * ---
 * DROPPED COLUMNS.
 *
 * `down()` restores the four columns as the `text` that `simple-array` compiles
 * to, but cannot restore contents. It does not need to: at the time of writing
 * every populated cell in all four was the empty string (verified — 0 non-empty
 * rows), because the only code that ever touched them assigned `[]` on profile
 * creation. Nothing reads them, on either side of the wire.
 *
 * ---
 * | column                                  | disposition        |
 * |-----------------------------------------|--------------------|
 * | buildings.photos                        | -> jsonb           |
 * | tenant_profiles.shortlisted_properties  | -> jsonb           |
 * | tenant_profiles.lifestyle               | dropped            |
 * | operator_profiles.operating_areas       | dropped            |
 * | operator_profiles.property_types        | dropped            |
 * | operator_profiles.services              | dropped            |
 *
 * Transactional (the data source's "each" mode gives this migration its own
 * transaction): no `CREATE INDEX CONCURRENTLY` here, so nothing has to opt out.
 * `ALTER TABLE ... TYPE` takes an ACCESS EXCLUSIVE lock and rewrites the table
 * — brief on these tables, but it is a write-blocking rewrite, not a metadata
 * flip, and should be run in a quiet window on a populated production table.
 */
export class SimpleArrayToJsonb1786233600000 implements MigrationInterface {
  name = "SimpleArrayToJsonb1786233600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- convert: buildings.photos -------------------------------------
    // The default has to go first: USING rewrites the rows but not the column
    // default, and ''::text is not valid jsonb, so the ALTER would fail on it.
    await queryRunner.query(
      `ALTER TABLE "buildings" ALTER COLUMN "photos" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ALTER COLUMN "photos" TYPE jsonb ` +
        `USING to_jsonb(string_to_array("photos", ','))`
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ALTER COLUMN "photos" SET DEFAULT '[]'`
    );

    // --- convert: tenant_profiles.shortlisted_properties ----------------
    // Nullable with no default, so no default dance is needed here.
    await queryRunner.query(
      `ALTER TABLE "tenant_profiles" ALTER COLUMN "shortlisted_properties" TYPE jsonb ` +
        `USING to_jsonb(string_to_array("shortlisted_properties", ','))`
    );

    // --- drop: never read, only ever written as [] ----------------------
    await queryRunner.query(
      `ALTER TABLE "tenant_profiles" DROP COLUMN "lifestyle"`
    );
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" DROP COLUMN "operating_areas"`
    );
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" DROP COLUMN "property_types"`
    );
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" DROP COLUMN "services"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // --- re-add the dropped columns, in the physical form `simple-array`
    // --- compiles to: nullable text, no default. Contents are not restorable.
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" ADD COLUMN "services" text`
    );
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" ADD COLUMN "property_types" text`
    );
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" ADD COLUMN "operating_areas" text`
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_profiles" ADD COLUMN "lifestyle" text`
    );

    // --- the inverse of to_jsonb(string_to_array(...)), as a function ---
    //
    // Unwinding a jsonb array back into a joined string needs
    // `jsonb_array_elements_text`, which is set-returning and so has to be
    // called in a subquery — and Postgres rejects a subquery inside an
    // `ALTER TABLE ... USING` ("cannot use subquery in transform expression").
    // Wrapping it in a function is what makes it legal there. The alternative,
    // a temporary column plus UPDATE plus RENAME, would move the column to the
    // end of the table for no benefit.
    //
    // Two details carry the round trip:
    //   - the outer CASE keeps NULL as NULL. Without it a NULL column would
    //     aggregate to zero rows and come back as '', which then reads as []
    //     instead of null.
    //   - the COALESCE maps the empty array to ''. array_agg over zero rows is
    //     NULL, not an empty array, so without it [] would come back as NULL.
    //
    // Result: NULL -> NULL, [] -> '', ["",""] -> ',', ["a","b"] -> 'a,b'.
    // WITH ORDINALITY pins element order, which jsonb preserves for arrays.
    await queryRunner.query(`
      CREATE FUNCTION pg_temp.jsonb_array_to_simple_array(val jsonb)
      RETURNS text AS $$
        SELECT CASE WHEN val IS NULL THEN NULL ELSE COALESCE(
          (SELECT array_to_string(array_agg(e ORDER BY ord), ',')
             FROM jsonb_array_elements_text(val) WITH ORDINALITY AS t(e, ord)),
          '') END
      $$ LANGUAGE sql IMMUTABLE
    `);

    // --- convert back: tenant_profiles.shortlisted_properties -----------
    await queryRunner.query(
      `ALTER TABLE "tenant_profiles" ALTER COLUMN "shortlisted_properties" TYPE text ` +
        `USING pg_temp.jsonb_array_to_simple_array("shortlisted_properties")`
    );

    // --- convert back: buildings.photos --------------------------------
    await queryRunner.query(
      `ALTER TABLE "buildings" ALTER COLUMN "photos" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ALTER COLUMN "photos" TYPE text ` +
        `USING pg_temp.jsonb_array_to_simple_array("photos")`
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ALTER COLUMN "photos" SET DEFAULT ''`
    );

    await queryRunner.query(
      `DROP FUNCTION pg_temp.jsonb_array_to_simple_array(jsonb)`
    );
  }
}
