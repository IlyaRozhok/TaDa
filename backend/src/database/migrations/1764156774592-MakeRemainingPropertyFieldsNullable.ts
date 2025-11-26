import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeRemainingPropertyFieldsNullable1764156774592 implements MigrationInterface {
  name = "MakeRemainingPropertyFieldsNullable1764156774592";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🏠 Making remaining property fields nullable...");

    // List of fields that might have NOT NULL constraint but should be nullable
    // These fields are not in the current Property entity but may exist in the database
    const optionalFields = [
      "available_from",
      "furnishing",
      "property_type",
      "is_btr",
    ];

    for (const field of optionalFields) {
      // Check if column exists and has NOT NULL constraint
      const columnInfo = await queryRunner.query(`
        SELECT 
          column_name,
          is_nullable,
          data_type
        FROM information_schema.columns
        WHERE table_name = 'properties' 
        AND column_name = $1
      `, [field]);

      if (columnInfo.length > 0 && columnInfo[0].is_nullable === "NO") {
        console.log(`  Making ${field} nullable...`);
        await queryRunner.query(`
          ALTER TABLE "properties"
          ALTER COLUMN "${field}" DROP NOT NULL
        `);
      } else if (columnInfo.length === 0) {
        console.log(`  Column ${field} does not exist, skipping...`);
      } else {
        console.log(`  Column ${field} is already nullable, skipping...`);
      }
    }

    console.log("✅ Successfully made remaining property fields nullable");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Reverting remaining property fields to NOT NULL...");

    // Note: This will fail if there are NULL values in the columns
    const optionalFields = [
      "available_from",
      "furnishing",
      "property_type",
      "is_btr",
    ];

    for (const field of optionalFields) {
      const columnInfo = await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'properties' 
        AND column_name = $1
      `, [field]);

      if (columnInfo.length > 0) {
        await queryRunner.query(`
          ALTER TABLE "properties"
          ALTER COLUMN "${field}" SET NOT NULL
        `);
      }
    }

    console.log("✅ Successfully reverted remaining property fields to NOT NULL");
  }
}
