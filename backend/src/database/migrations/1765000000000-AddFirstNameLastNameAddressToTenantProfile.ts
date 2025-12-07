import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFirstNameLastNameAddressToTenantProfile1765000000000
  implements MigrationInterface
{
  name = "AddFirstNameLastNameAddressToTenantProfile1765000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Adding first_name, last_name, address to tenant_profiles...");

    // Add first_name column
    await queryRunner.query(`
      ALTER TABLE "tenant_profiles"
      ADD COLUMN IF NOT EXISTS "first_name" character varying
    `);

    // Add last_name column
    await queryRunner.query(`
      ALTER TABLE "tenant_profiles"
      ADD COLUMN IF NOT EXISTS "last_name" character varying
    `);

    // Add address column
    await queryRunner.query(`
      ALTER TABLE "tenant_profiles"
      ADD COLUMN IF NOT EXISTS "address" character varying
    `);

    // Migrate existing full_name to first_name and last_name if full_name exists
    await queryRunner.query(`
      UPDATE "tenant_profiles"
      SET 
        "first_name" = CASE 
          WHEN "full_name" IS NOT NULL AND position(' ' in "full_name") > 0 
          THEN substring("full_name" from 1 for position(' ' in "full_name") - 1)
          ELSE "full_name"
        END,
        "last_name" = CASE 
          WHEN "full_name" IS NOT NULL AND position(' ' in "full_name") > 0 
          THEN substring("full_name" from position(' ' in "full_name") + 1)
          ELSE NULL
        END
      WHERE "full_name" IS NOT NULL AND ("first_name" IS NULL OR "last_name" IS NULL)
    `);

    console.log("✅ Added first_name, last_name, address columns to tenant_profiles");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Removing first_name, last_name, address from tenant_profiles...");

    // Remove address column
    await queryRunner.query(`
      ALTER TABLE "tenant_profiles"
      DROP COLUMN IF EXISTS "address"
    `);

    // Remove last_name column
    await queryRunner.query(`
      ALTER TABLE "tenant_profiles"
      DROP COLUMN IF EXISTS "last_name"
    `);

    // Remove first_name column
    await queryRunner.query(`
      ALTER TABLE "tenant_profiles"
      DROP COLUMN IF EXISTS "first_name"
    `);

    console.log("✅ Removed first_name, last_name, address columns from tenant_profiles");
  }
}

