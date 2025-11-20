import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAmenitiesToBuildings1756000000007
  implements MigrationInterface
{
  name = "AddAmenitiesToBuildings1756000000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🏗️ Adding amenities column to buildings...");

    // Add amenities column as JSONB with default empty array
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD COLUMN "amenities" jsonb DEFAULT '[]'::jsonb
    `);

    console.log("✅ Successfully added amenities column to buildings");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Removing amenities column from buildings...");

    // Drop amenities column
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP COLUMN IF EXISTS "amenities"
    `);

    console.log("✅ Successfully removed amenities column from buildings");
  }
}






