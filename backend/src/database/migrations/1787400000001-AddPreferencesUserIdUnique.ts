import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * One preferences row per user, enforced by the database.
 *
 * `preferences.user_id` only ever had a foreign key — no UNIQUE. The upsert
 * in PreferencesService is check-then-insert, so two concurrent first saves
 * could both pass the check and create two rows; every consumer then reads
 * with `findOne({ user_id })` and nondeterministically picks one — matching
 * could score a different row than the profile screen edits.
 *
 * Step 1 deduplicates: for each user the newest row (by `updated_at`, ties
 * broken by `id`) survives; older duplicates are deleted. Step 2 adds the
 * unique index the entity now declares (`uq_preferences_user_id`).
 *
 * `down` drops the index only — deleted duplicates are gone, deliberately.
 */
export class AddPreferencesUserIdUnique1787400000001
  implements MigrationInterface
{
  name = "AddPreferencesUserIdUnique1787400000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "preferences" older
      USING "preferences" newer
      WHERE older."user_id" = newer."user_id"
        AND (
          older."updated_at" < newer."updated_at"
          OR (older."updated_at" = newer."updated_at" AND older."id" < newer."id")
        )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_preferences_user_id" ON "preferences" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_preferences_user_id"`,
    );
  }
}
