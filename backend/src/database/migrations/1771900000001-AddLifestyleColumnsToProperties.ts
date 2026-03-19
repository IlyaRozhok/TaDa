import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLifestyleColumnsToProperties1771900000001
  implements MigrationInterface
{
  name = "AddLifestyleColumnsToProperties1771900000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "family_status" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "occupation" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "children" jsonb DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "children"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "occupation"`);
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN "family_status"`,
    );
  }
}
