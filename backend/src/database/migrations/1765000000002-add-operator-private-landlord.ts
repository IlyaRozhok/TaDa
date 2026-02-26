import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOperatorPrivateLandlord1765000000002
  implements MigrationInterface
{
  name = "AddOperatorPrivateLandlord1765000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" ADD COLUMN "is_private_landlord" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" DROP COLUMN "is_private_landlord"`,
    );
  }
}

