import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Location foundation for matching and search (review roadmap, package B2).
 *
 * The address was one free-text string: no postcode, no coordinates, no
 * borough — so the location scorer (weight 15, second-highest) had nothing
 * to read and search could not find "Camden" or "NW1". These columns are
 * filled by GeocodingService (postcodes.io) on property create/update; all
 * nullable, since a listing without a resolvable postcode must still save.
 * Existing rows stay null until their address or postcode is next edited.
 */
export class AddPropertyGeocoding1787600000000 implements MigrationInterface {
  name = "AddPropertyGeocoding1787600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "postcode" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "latitude" numeric(9,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "longitude" numeric(9,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "borough" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "borough"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "latitude"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "postcode"`);
  }
}
