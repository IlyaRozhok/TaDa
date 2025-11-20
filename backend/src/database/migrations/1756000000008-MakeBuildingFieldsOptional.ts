import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeBuildingFieldsOptional1756000000008
  implements MigrationInterface
{
  name = "MakeBuildingFieldsOptional1756000000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🏗️ Making building fields optional...");

    // Make address nullable
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "address" DROP NOT NULL
    `);

    // Make number_of_units nullable
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "number_of_units" DROP NOT NULL
    `);

    // Make type_of_unit nullable (first drop the constraint, then alter column, then add constraint back)
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "CHK_type_of_unit"
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "type_of_unit" DROP NOT NULL,
      ALTER COLUMN "type_of_unit" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD CONSTRAINT "CHK_type_of_unit" 
      CHECK ("type_of_unit" IS NULL OR "type_of_unit" IN ('studio', '1-bed', '2-bed', '3-bed', 'Duplex', 'penthouse'))
    `);

    // Make documents nullable
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "documents" DROP NOT NULL,
      ALTER COLUMN "documents" DROP DEFAULT
    `);

    // Make photos nullable (simple-array is stored as text)
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "photos" DROP NOT NULL,
      ALTER COLUMN "photos" SET DEFAULT ''
    `);

    // Make tenant_type nullable (first drop the constraint, then alter column, then add constraint back)
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "CHK_tenant_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "tenant_type" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD CONSTRAINT "CHK_tenant_type" 
      CHECK ("tenant_type" IS NULL OR "tenant_type" IN ('corporateLets', 'sharers', 'student', 'family', 'elder'))
    `);

    console.log("✅ Successfully made building fields optional");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Reverting building fields to required...");

    // Drop constraints before making fields NOT NULL
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "CHK_type_of_unit"
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "CHK_tenant_type"
    `);

    // Make address NOT NULL (set default empty string for existing nulls)
    await queryRunner.query(`
      UPDATE "buildings" SET "address" = '' WHERE "address" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "address" SET NOT NULL
    `);

    // Make number_of_units NOT NULL (set default 0 for existing nulls)
    await queryRunner.query(`
      UPDATE "buildings" SET "number_of_units" = 0 WHERE "number_of_units" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "number_of_units" SET NOT NULL
    `);

    // Make type_of_unit NOT NULL with default
    await queryRunner.query(`
      UPDATE "buildings" SET "type_of_unit" = 'studio' WHERE "type_of_unit" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "type_of_unit" SET NOT NULL,
      ALTER COLUMN "type_of_unit" SET DEFAULT 'studio'
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD CONSTRAINT "CHK_type_of_unit" 
      CHECK ("type_of_unit" IN ('studio', '1-bed', '2-bed', '3-bed', 'Duplex', 'penthouse'))
    `);

    // Make documents NOT NULL with default
    await queryRunner.query(`
      UPDATE "buildings" SET "documents" = '' WHERE "documents" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "documents" SET NOT NULL,
      ALTER COLUMN "documents" SET DEFAULT ''
    `);

    // Make photos NOT NULL
    await queryRunner.query(`
      UPDATE "buildings" SET "photos" = '' WHERE "photos" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "photos" SET NOT NULL
    `);

    // Make tenant_type NOT NULL with default
    await queryRunner.query(`
      UPDATE "buildings" SET "tenant_type" = 'family' WHERE "tenant_type" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "tenant_type" SET NOT NULL,
      ALTER COLUMN "tenant_type" SET DEFAULT 'family'
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD CONSTRAINT "CHK_tenant_type" 
      CHECK ("tenant_type" IN ('corporateLets', 'sharers', 'student', 'family', 'elder'))
    `);

    console.log("✅ Successfully reverted building fields to required");
  }
}

