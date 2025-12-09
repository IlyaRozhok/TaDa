import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBuildingLocation1767000000001 implements MigrationInterface {
  name = "UpdateBuildingLocation1767000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "areas" jsonb DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "districts" jsonb DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" DROP COLUMN "commute_times"`
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" DROP COLUMN "local_essentials"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "local_essentials" jsonb`
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "commute_times" jsonb`
    );
    await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "districts"`);
    await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "areas"`);
  }
}
