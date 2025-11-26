import { MigrationInterface, QueryRunner } from "typeorm";

export class MakePropertyAddressNullable1764156275653 implements MigrationInterface {
  name = "MakePropertyAddressNullable1764156275653";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if address column exists in properties table
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'address'
      )
    `);

    if (columnExists[0]?.exists) {
      // Make address column nullable
      await queryRunner.query(`
        ALTER TABLE "properties"
        ALTER COLUMN "address" DROP NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: make address column NOT NULL
    // Note: This will fail if there are NULL values in the column
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'address'
      )
    `);

    if (columnExists[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE "properties"
        ALTER COLUMN "address" SET NOT NULL
      `);
    }
  }
}
