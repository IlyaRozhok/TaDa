import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncPropertyEntityWithDatabase1756000000009
  implements MigrationInterface
{
  name = "SyncPropertyEntityWithDatabase1756000000009";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🏠 Syncing Property entity with database...");

    // Add missing columns to properties table
    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "apartment_number" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "descriptions" text
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "deposit" numeric(10,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "bills" character varying DEFAULT 'excluded'
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "building_type" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "let_duration" character varying DEFAULT 'any'
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "floor" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "outdoor_space" boolean DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "balcony" boolean DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "terrace" boolean DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "square_meters" numeric(10,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "photos" text[]
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "video" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "documents" character varying
    `);

    // Update existing columns to be nullable where needed
    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "bedrooms" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "bathrooms" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "furnishing" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "property_type" DROP NOT NULL
    `);

    console.log("✅ Successfully synced Property entity with database");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Reverting Property entity sync...");

    // Remove added columns
    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "apartment_number"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "descriptions"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "deposit"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "bills"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "building_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "let_duration"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "floor"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "outdoor_space"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "balcony"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "terrace"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "square_meters"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "photos"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "video"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "documents"
    `);

    // Revert nullable changes
    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "bedrooms" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "bathrooms" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "furnishing" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ALTER COLUMN "property_type" SET NOT NULL
    `);

    console.log("✅ Successfully reverted Property entity sync");
  }
}

