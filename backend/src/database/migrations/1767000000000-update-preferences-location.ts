import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePreferencesLocation1767000000000
  implements MigrationInterface
{
  name = "UpdatePreferencesLocation1767000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "preferred_areas" jsonb DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "preferred_districts" jsonb DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "preferred_essentials"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "preferred_commute_times"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "preferred_commute_times" jsonb DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "preferred_essentials" jsonb DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "preferred_districts"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "preferred_areas"`
    );
  }
}
