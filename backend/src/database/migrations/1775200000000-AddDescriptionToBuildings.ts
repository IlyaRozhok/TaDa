import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionToBuildings1775200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "buildings" ADD "description" text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "buildings" DROP COLUMN "description"`,
    );
  }
}
