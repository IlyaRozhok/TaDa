import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyAmenities1764200000000 implements MigrationInterface {
  name = "AddPropertyAmenities1764200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "property_amenities" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD COLUMN IF NOT EXISTS "property_amenities" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "property_amenities"`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN IF EXISTS "property_amenities"`,
    );
  }
}
