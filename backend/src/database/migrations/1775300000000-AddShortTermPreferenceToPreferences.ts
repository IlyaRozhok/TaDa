import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShortTermPreferenceToPreferences1775300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "short_term_preference" character varying DEFAULT 'any'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "short_term_preference"`,
    );
  }
}
