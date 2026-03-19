import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLifestyleColumnsToBuildings1771900000000
  implements MigrationInterface
{
  name = "AddLifestyleColumnsToBuildings1771900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "family_status" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "occupation" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "children" jsonb DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "children"`);
    await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "occupation"`);
    await queryRunner.query(
      `ALTER TABLE "buildings" DROP COLUMN "family_status"`,
    );
  }
}
