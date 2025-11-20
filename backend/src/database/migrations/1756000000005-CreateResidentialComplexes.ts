import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResidentialComplexes1756000000005 implements MigrationInterface {
  name = "CreateResidentialComplexes1756000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🏢 Creating residential_complexes table...");

    // Create residential_complexes table
    await queryRunner.query(`
      CREATE TABLE "residential_complexes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "address" character varying NOT NULL,
        "description" text,
        "total_units" integer,
        "year_built" integer,
        "amenities" text,
        "postcode" character varying,
        "city" character varying,
        "country" character varying,
        "latitude" numeric(10,8),
        "longitude" numeric(11,8),
        "contact_phone" character varying,
        "contact_email" character varying,
        "website" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "operator_id" uuid NOT NULL,
        CONSTRAINT "PK_residential_complexes" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint to users table
    await queryRunner.query(`
      ALTER TABLE "residential_complexes" 
      ADD CONSTRAINT "FK_residential_complexes_operator" 
      FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Add residential_complex_id column to properties table
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "residential_complex_id" uuid
    `);

    // Add foreign key constraint from properties to residential_complexes
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD CONSTRAINT "FK_properties_residential_complex" 
      FOREIGN KEY ("residential_complex_id") REFERENCES "residential_complexes"("id") ON DELETE SET NULL
    `);

    console.log("✅ Residential complexes table created successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🗑️ Dropping residential_complexes table...");

    // Drop foreign key constraint from properties table
    await queryRunner.query(`
      ALTER TABLE "properties" 
      DROP CONSTRAINT "FK_properties_residential_complex"
    `);

    // Drop residential_complex_id column from properties table
    await queryRunner.query(`
      ALTER TABLE "properties" 
      DROP COLUMN "residential_complex_id"
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "residential_complexes" 
      DROP CONSTRAINT "FK_residential_complexes_operator"
    `);

    // Drop residential_complexes table
    await queryRunner.query(`DROP TABLE "residential_complexes"`);

    console.log("✅ Residential complexes table dropped successfully");
  }
}


