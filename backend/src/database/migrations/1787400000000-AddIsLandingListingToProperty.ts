import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Marks the handful of properties the marketing landing pages put in front of
 * signed-out visitors.
 *
 * NOT NULL DEFAULT false so the column is additive: every existing row keeps
 * its current (absent) behaviour and the landing section simply stays hidden
 * until an admin flags something. Order and audience are deliberately not
 * columns — the section shows the newest flagged listings on both landings.
 */
export class AddIsLandingListingToProperty1787400000000
  implements MigrationInterface
{
  name = "AddIsLandingListingToProperty1787400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "is_landing_listing" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN "is_landing_listing"`,
    );
  }
}
