import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Data migration (NOT schema): backfills personal/contact fields onto the
 * canonical `users` table from the legacy mirror columns on `tenant_profiles`
 * and `operator_profiles`.
 *
 * This is hand-written on purpose — `migration:generate` only diffs the schema
 * and cannot express a data move. It must run BEFORE the migration that drops
 * the duplicate columns from the profile tables.
 *
 * Strategy: for each identity field, keep the value already on the user; only
 * fall back to the profile value when the user's is NULL or empty. Idempotent
 * and safe to re-run.
 */
export class BackfillUserIdentityFromProfiles1775300000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // tenant_profiles → users
    await queryRunner.query(`
      UPDATE "users" u SET
        "full_name"     = COALESCE(NULLIF(u."full_name", ''), tp."full_name"),
        "first_name"    = COALESCE(NULLIF(u."first_name", ''), tp."first_name"),
        "last_name"     = COALESCE(NULLIF(u."last_name", ''), tp."last_name"),
        "address"       = COALESCE(NULLIF(u."address", ''), tp."address"),
        "phone"         = COALESCE(NULLIF(u."phone", ''), tp."phone"),
        "nationality"   = COALESCE(NULLIF(u."nationality", ''), tp."nationality"),
        "date_of_birth" = COALESCE(u."date_of_birth", tp."date_of_birth")
      FROM "tenant_profiles" tp
      WHERE tp."userId" = u."id"
    `);

    // operator_profiles → users (operators only duplicate a subset)
    await queryRunner.query(`
      UPDATE "users" u SET
        "full_name"     = COALESCE(NULLIF(u."full_name", ''), op."full_name"),
        "phone"         = COALESCE(NULLIF(u."phone", ''), op."phone"),
        "nationality"   = COALESCE(NULLIF(u."nationality", ''), op."nationality"),
        "date_of_birth" = COALESCE(u."date_of_birth", op."date_of_birth")
      FROM "operator_profiles" op
      WHERE op."userId" = u."id"
    `);
  }

  public async down(): Promise<void> {
    // No-op: this is a one-way data consolidation. The profile columns still
    // exist at this point, so no data is lost by not reversing the backfill.
  }
}
