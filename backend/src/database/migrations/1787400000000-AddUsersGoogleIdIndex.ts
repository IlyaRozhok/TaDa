import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Re-creates the index on `users.google_id`.
 *
 * It existed in the initial schema and was dropped — along with several
 * others — by the auto-generated `1764203300507-add-deposit` migration.
 * `google_id` is the hottest auth-path lookup in a Google-OAuth-only product:
 * every sign-in resolves the account with `findOne({ where: { google_id } })`,
 * which without the index is a sequential scan over `users`.
 *
 * Same non-transactional CONCURRENTLY pattern as `AddPerformanceIndexes`
 * (1785801600000) — see that migration's header for the re-run and revert
 * caveats (INVALID leftovers after an interrupted build; `mig:revert:notx`).
 */
export class AddUsersGoogleIdIndex1787400000000 implements MigrationInterface {
  name = "AddUsersGoogleIdIndex1787400000000";

  /** `CREATE INDEX CONCURRENTLY` is illegal inside a transaction block. */
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_google_id" ON "users" ("google_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_users_google_id"`,
    );
  }
}
