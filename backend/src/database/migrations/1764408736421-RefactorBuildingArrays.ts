import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorBuildingArrays1764408736421 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, add temporary columns
        await queryRunner.query(`ALTER TABLE "buildings" ADD COLUMN "tenant_type_new" jsonb`);
        await queryRunner.query(`ALTER TABLE "buildings" ADD COLUMN "type_of_unit_new" jsonb`);

        // Set default values first
        await queryRunner.query(`UPDATE "buildings" SET "tenant_type_new" = '["family"]'::jsonb`);
        await queryRunner.query(`UPDATE "buildings" SET "type_of_unit_new" = '[]'::jsonb`);

        // Update non-null tenant_type values
        await queryRunner.query(`UPDATE "buildings" SET "tenant_type_new" = json_build_array("tenant_type"::text) WHERE "tenant_type" IS NOT NULL`);

        // Update non-null type_of_unit values
        await queryRunner.query(`UPDATE "buildings" SET "type_of_unit_new" = json_build_array("type_of_unit"::text) WHERE "type_of_unit" IS NOT NULL`);

        // Drop old columns
        await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "tenant_type"`);
        await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "type_of_unit"`);

        // Rename new columns
        await queryRunner.query(`ALTER TABLE "buildings" RENAME COLUMN "tenant_type_new" TO "tenant_type"`);
        await queryRunner.query(`ALTER TABLE "buildings" RENAME COLUMN "type_of_unit_new" TO "type_of_unit"`);

        // Set defaults
        await queryRunner.query(`ALTER TABLE "buildings" ALTER COLUMN "tenant_type" SET DEFAULT '["family"]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "buildings" ALTER COLUMN "type_of_unit" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // First, add temporary columns
        await queryRunner.query(`ALTER TABLE "buildings" ADD COLUMN "tenant_type_old" character varying`);
        await queryRunner.query(`ALTER TABLE "buildings" ADD COLUMN "type_of_unit_old" character varying`);

        // Convert data back to old format (take first element of array)
        await queryRunner.query(`UPDATE "buildings" SET "tenant_type_old" = CASE WHEN jsonb_array_length("tenant_type") > 0 THEN "tenant_type"->>0 ELSE 'family' END`);
        await queryRunner.query(`UPDATE "buildings" SET "type_of_unit_old" = CASE WHEN jsonb_array_length("type_of_unit") > 0 THEN "type_of_unit"->>0 ELSE NULL END`);

        // Drop new columns
        await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "tenant_type"`);
        await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "type_of_unit"`);

        // Rename old columns back
        await queryRunner.query(`ALTER TABLE "buildings" RENAME COLUMN "tenant_type_old" TO "tenant_type"`);
        await queryRunner.query(`ALTER TABLE "buildings" RENAME COLUMN "type_of_unit_old" TO "type_of_unit"`);

        // Set defaults and constraints for old format
        await queryRunner.query(`ALTER TABLE "buildings" ALTER COLUMN "tenant_type" SET DEFAULT 'family'`);
        await queryRunner.query(`ALTER TABLE "buildings" ADD CONSTRAINT "CHK_tenant_type" CHECK (("tenant_type" IS NULL) OR (("tenant_type")::text = ANY ((ARRAY['corporateLets'::character varying, 'sharers'::character varying, 'student'::character varying, 'family'::character varying, 'elder'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "buildings" ADD CONSTRAINT "CHK_type_of_unit" CHECK (("type_of_unit" IS NULL) OR (("type_of_unit")::text = ANY ((ARRAY['studio'::character varying, '1-bed'::character varying, '2-bed'::character varying, '3-bed'::character varying, 'Duplex'::character varying, 'penthouse'::character varying])::text[])))`);
    }

}
