import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPhotosColumnType1760000000000 implements MigrationInterface {
  name = "FixPhotosColumnType1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("📸 Fixing photos column type for proper array handling...");

    // Since we already created the column as text[] in previous migration,
    // and updated the entity to use @Column("text", { array: true }),
    // we just need to ensure the column exists and has correct default
    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "photos" SET DEFAULT '{}'::text[]
    `);

    console.log("✅ Photos column type fixed");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Reverting photos column type fix...");

    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "photos" DROP DEFAULT
    `);

    console.log("✅ Photos column type revert completed");
  }
}
