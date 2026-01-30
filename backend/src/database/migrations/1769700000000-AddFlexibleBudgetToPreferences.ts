import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlexibleBudgetToPreferences1769700000000 implements MigrationInterface {
  name = "AddFlexibleBudgetToPreferences1769700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "flexible_budget" boolean`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "flexible_budget"`,
    );
  }
}
