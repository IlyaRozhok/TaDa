import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Copies every id out of `tenant_profiles.shortlisted_properties` (jsonb
 * array) into the `shortlist` table, which has existed since InitialSchema
 * but was never written to — the service read-modify-wrote the array
 * instead, losing concurrent updates. From this release the service reads
 * and writes only the table.
 *
 * Additive and idempotent:
 * - ids whose property no longer exists are skipped (the table has a FK,
 *   the array never enforced one);
 * - ids whose user no longer exists are skipped for the same reason;
 * - re-running hits `ON CONFLICT ... DO NOTHING` on the
 *   ("userId","propertyId") unique constraint.
 *
 * The jsonb column itself is left in place, frozen at its pre-migration
 * content. Dropping it is a separate, later migration once the table has
 * been verified in production (recorded in PROGRESS.md).
 */
export class BackfillShortlistTable1787310000000 implements MigrationInterface {
  name = "BackfillShortlistTable1787310000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The inner subquery (with its OFFSET 0 optimization barrier) drops
    // anything that is not shaped like a uuid BEFORE the outer casts run —
    // one malformed string in one profile must not abort the whole backfill.
    await queryRunner.query(`
      INSERT INTO "shortlist" ("id", "userId", "propertyId")
      SELECT uuid_generate_v4(), s."userId", s.property_id::uuid
      FROM (
        SELECT tp."userId", elem.property_id
        FROM "tenant_profiles" tp
        CROSS JOIN LATERAL jsonb_array_elements_text(
          COALESCE(tp."shortlisted_properties", '[]'::jsonb)
        ) AS elem(property_id)
        WHERE elem.property_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        OFFSET 0
      ) s
      WHERE EXISTS (SELECT 1 FROM "properties" p WHERE p."id" = s.property_id::uuid)
        AND EXISTS (SELECT 1 FROM "users" u WHERE u."id" = s."userId")
      ON CONFLICT ("userId", "propertyId") DO NOTHING
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Deliberately a no-op: the backfill is additive, and by revert time the
    // table may hold rows created organically after the deploy — deleting
    // "backfilled" rows cannot be told apart from deleting user data. The
    // jsonb column still holds its pre-migration content if a manual
    // recovery is ever needed.
  }
}
