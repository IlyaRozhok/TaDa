import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorResidentialComplexesToBuildings1756000000006
  implements MigrationInterface
{
  name = "RefactorResidentialComplexesToBuildings1756000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🏗️ Refactoring residential_complexes to buildings...");

    // Step 1: Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "properties" 
      DROP CONSTRAINT IF EXISTS "FK_properties_residential_complex"
    `);

    await queryRunner.query(`
      ALTER TABLE "residential_complexes" 
      DROP CONSTRAINT IF EXISTS "FK_residential_complexes_operator"
    `);

    // Step 2: Rename table
    await queryRunner.query(`
      ALTER TABLE "residential_complexes" 
      RENAME TO "buildings"
    `);

    // Step 3: Rename column in properties table
    await queryRunner.query(`
      ALTER TABLE "properties" 
      RENAME COLUMN "residential_complex_id" TO "building_id"
    `);

    // Step 4: Drop old columns that are not needed
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP COLUMN IF EXISTS "description",
      DROP COLUMN IF EXISTS "year_built",
      DROP COLUMN IF EXISTS "amenities",
      DROP COLUMN IF EXISTS "postcode",
      DROP COLUMN IF EXISTS "city",
      DROP COLUMN IF EXISTS "country",
      DROP COLUMN IF EXISTS "latitude",
      DROP COLUMN IF EXISTS "longitude",
      DROP COLUMN IF EXISTS "contact_phone",
      DROP COLUMN IF EXISTS "contact_email",
      DROP COLUMN IF EXISTS "website"
    `);

    // Step 5: Rename total_units to number_of_units
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      RENAME COLUMN "total_units" TO "number_of_units"
    `);

    // Step 6: Make number_of_units NOT NULL
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "number_of_units" SET NOT NULL
    `);

    // Step 7: Add new columns
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD COLUMN "type_of_unit" character varying NOT NULL DEFAULT 'studio',
      ADD COLUMN "logo" character varying,
      ADD COLUMN "video" character varying,
      ADD COLUMN "photos" text NOT NULL DEFAULT '',
      ADD COLUMN "documents" character varying NOT NULL DEFAULT '',
      ADD COLUMN "metro_stations" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "commute_times" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "local_essentials" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "is_concierge" boolean NOT NULL DEFAULT false,
      ADD COLUMN "concierge_hours" jsonb,
      ADD COLUMN "pet_policy" boolean NOT NULL DEFAULT false,
      ADD COLUMN "pets" jsonb,
      ADD COLUMN "smoking_area" boolean NOT NULL DEFAULT false,
      ADD COLUMN "tenant_type" character varying NOT NULL DEFAULT 'family'
    `);

    // Step 8: Create type constraints (enum-like)
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "CHK_type_of_unit"
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD CONSTRAINT "CHK_type_of_unit" 
      CHECK ("type_of_unit" IN ('studio', '1-bed', '2-bed', '3-bed', 'Duplex', 'penthouse'))
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "CHK_tenant_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD CONSTRAINT "CHK_tenant_type" 
      CHECK ("tenant_type" IN ('corporateLets', 'sharers', 'student', 'family', 'elder'))
    `);

    // Step 9: Re-add foreign key constraints with new names
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD CONSTRAINT "FK_buildings_operator" 
      FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD CONSTRAINT "FK_properties_building" 
      FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL
    `);

    console.log(
      "✅ Successfully refactored residential_complexes to buildings"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Reverting buildings to residential_complexes...");

    // Step 1: Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "properties" 
      DROP CONSTRAINT IF EXISTS "FK_properties_building"
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "FK_buildings_operator"
    `);

    // Step 2: Drop constraints
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "CHK_type_of_unit"
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP CONSTRAINT IF EXISTS "CHK_tenant_type"
    `);

    // Step 3: Drop new columns
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      DROP COLUMN IF EXISTS "type_of_unit",
      DROP COLUMN IF EXISTS "logo",
      DROP COLUMN IF EXISTS "video",
      DROP COLUMN IF EXISTS "photos",
      DROP COLUMN IF EXISTS "documents",
      DROP COLUMN IF EXISTS "metro_stations",
      DROP COLUMN IF EXISTS "commute_times",
      DROP COLUMN IF EXISTS "local_essentials",
      DROP COLUMN IF EXISTS "is_concierge",
      DROP COLUMN IF EXISTS "concierge_hours",
      DROP COLUMN IF EXISTS "pet_policy",
      DROP COLUMN IF EXISTS "pets",
      DROP COLUMN IF EXISTS "smoking_area",
      DROP COLUMN IF EXISTS "tenant_type"
    `);

    // Step 4: Rename number_of_units back to total_units
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ALTER COLUMN "number_of_units" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "buildings" 
      RENAME COLUMN "number_of_units" TO "total_units"
    `);

    // Step 5: Add back old columns
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      ADD COLUMN "description" text,
      ADD COLUMN "year_built" integer,
      ADD COLUMN "amenities" text,
      ADD COLUMN "postcode" character varying,
      ADD COLUMN "city" character varying,
      ADD COLUMN "country" character varying,
      ADD COLUMN "latitude" numeric(10,8),
      ADD COLUMN "longitude" numeric(11,8),
      ADD COLUMN "contact_phone" character varying,
      ADD COLUMN "contact_email" character varying,
      ADD COLUMN "website" character varying
    `);

    // Step 6: Rename column in properties table
    await queryRunner.query(`
      ALTER TABLE "properties" 
      RENAME COLUMN "building_id" TO "residential_complex_id"
    `);

    // Step 7: Rename table back
    await queryRunner.query(`
      ALTER TABLE "buildings" 
      RENAME TO "residential_complexes"
    `);

    // Step 8: Re-add foreign key constraints with old names
    await queryRunner.query(`
      ALTER TABLE "residential_complexes" 
      ADD CONSTRAINT "FK_residential_complexes_operator" 
      FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD CONSTRAINT "FK_properties_residential_complex" 
      FOREIGN KEY ("residential_complex_id") REFERENCES "residential_complexes"("id") ON DELETE SET NULL
    `);

    console.log("✅ Successfully reverted buildings to residential_complexes");
  }
}
