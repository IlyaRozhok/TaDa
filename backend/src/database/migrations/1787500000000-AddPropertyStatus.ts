import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Listing lifecycle for properties (review roadmap, package B).
 *
 * Until now nothing ever unlisted a property: a booking closed as `rented`
 * left the flat in the public catalogue, in matching and bookable forever.
 * The `status` column is the anchor for the lifecycle; every existing row is
 * backfilled to `listed` via the column default, so nothing disappears from
 * the market on deploy.
 *
 * The enum type name matches what TypeORM synchronize derives for
 * `properties.status` ("properties_status_enum"), so migrated and
 * synchronized environments agree on the schema.
 */
export class AddPropertyStatus1787500000000 implements MigrationInterface {
  name = "AddPropertyStatus1787500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "properties_status_enum" AS ENUM('draft', 'listed', 'under_offer', 'let', 'archived')`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "status" "properties_status_enum" NOT NULL DEFAULT 'listed'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "properties_status_enum"`);
  }
}
