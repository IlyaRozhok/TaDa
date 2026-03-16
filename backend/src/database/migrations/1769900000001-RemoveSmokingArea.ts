import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSmokingArea1769900000001 implements MigrationInterface {
  name = "RemoveSmokingArea1769900000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN IF EXISTS "smoking_area"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" DROP COLUMN IF EXISTS "smoking_area"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN IF EXISTS "smoking_area"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "smoking_area" boolean`,
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "smoking_area" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "smoking_area" boolean`,
    );
  }
}

