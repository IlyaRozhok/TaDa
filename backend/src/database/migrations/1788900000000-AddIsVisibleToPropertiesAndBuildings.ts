import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Admin visibility: one flag on each of `properties` and `buildings`. Additive
 * and idempotent; DEFAULT true keeps every existing row visible, and a constant
 * default is a metadata-only change on Postgres 11+, with no table rewrite.
 *
 * A building's flag is not copied onto its properties. Effective visibility is
 * derived at read time (see property.visibility.ts), so hiding and restoring a
 * building leaves each property's own choice intact.
 */
export class AddIsVisibleToPropertiesAndBuildings1788900000000 implements MigrationInterface {
  name = "AddIsVisibleToPropertiesAndBuildings1788900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "is_visible" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "is_visible" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN IF EXISTS "is_visible"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "is_visible"`);
  }
}
