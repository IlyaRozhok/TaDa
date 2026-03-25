import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Removes legacy / redundant preferences columns superseded by newer fields
 * (e.g. property_types vs property_type) or stored elsewhere (tenant_cvs kyc).
 */
export class DropUnusedPreferencesColumns1774700000000
  implements MigrationInterface
{
  name = "DropUnusedPreferencesColumns1774700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_preferences_property_type_gin"`,
    );

    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "kyc_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "referencing_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "primary_postcode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "commute_location"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "commute_time_walk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "commute_time_cycle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "commute_time_tube"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "house_shares"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "date_property_added"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "deposit_preference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "property_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "building_style"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "lifestyle_features"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "social_features"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "work_features"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "convenience_features"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "pet_friendly_features"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "luxury_features"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "kyc_status" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "referencing_status" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "primary_postcode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "commute_location" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "commute_time_walk" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "commute_time_cycle" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "commute_time_tube" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "house_shares" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "date_property_added" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "deposit_preference" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "property_type" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "building_style" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "lifestyle_features" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "social_features" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "work_features" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "convenience_features" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "pet_friendly_features" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "luxury_features" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_preferences_property_type_gin" ON "preferences" USING GIN ("property_type")`,
    );
  }
}
