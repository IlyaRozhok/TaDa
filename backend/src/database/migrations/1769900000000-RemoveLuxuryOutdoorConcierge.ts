import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveLuxuryOutdoorConcierge1769900000000
  implements MigrationInterface
{
  name = "RemoveLuxuryOutdoorConcierge1769900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop property-level flags no longer used
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "luxury"`);
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN IF EXISTS "outdoor_space"`,
    );

    // Drop building-level concierge flags
    await queryRunner.query(
      `ALTER TABLE "buildings" DROP COLUMN IF EXISTS "is_concierge"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" DROP COLUMN IF EXISTS "concierge_hours"`,
    );

    // Drop preference-level flags
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "outdoor_space"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "is_concierge"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate preference-level flags (nullable booleans as before)
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "is_concierge" boolean`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "outdoor_space" boolean`,
    );

    // Recreate building-level concierge fields
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "concierge_hours" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "is_concierge" boolean NOT NULL DEFAULT false`,
    );

    // Recreate property-level flags
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "outdoor_space" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "luxury" boolean NOT NULL DEFAULT false`,
    );
  }
}

