import { MigrationInterface, QueryRunner } from "typeorm";

export class MakePropertyDescriptionNullable1764156142920 implements MigrationInterface {
  name = "MakePropertyDescriptionNullable1764156142920";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make description column nullable
    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "description" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: make description column NOT NULL
    // Note: This will fail if there are NULL values in the column
    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "description" SET NOT NULL
    `);
  }
}
