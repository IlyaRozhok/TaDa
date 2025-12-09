import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTenantCv1767000000000 implements MigrationInterface {
  name = "CreateTenantCv1767000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Creating tenant_cvs table...");

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_cvs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid UNIQUE NOT NULL,
        "share_uuid" uuid UNIQUE,
        "headline" character varying,
        "about_me" text,
        "hobbies" jsonb DEFAULT '[]',
        "rent_history" jsonb DEFAULT '[]',
        "kyc_status" character varying,
        "referencing_status" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_tenant_cvs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Ensure updated_at auto-updates
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS tenant_cvs_updated_at ON "tenant_cvs";
      CREATE TRIGGER tenant_cvs_updated_at
      BEFORE UPDATE ON "tenant_cvs"
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
    `);

    console.log("✅ tenant_cvs table created");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Dropping tenant_cvs table...");
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_cvs";`);
    console.log("✅ tenant_cvs table dropped");
  }
}
