import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveOccupationToPreferences1767461425272 implements MigrationInterface {
    name = 'MoveOccupationToPreferences1767461425272'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant_cvs" DROP CONSTRAINT IF EXISTS "FK_tenant_cvs_user"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT IF EXISTS "FK_booking_requests_property"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT IF EXISTS "FK_booking_requests_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_price"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_bedrooms"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_bathrooms"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_property_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_furnishing"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_tenant_types"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_amenities"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_available_from"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_operator_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_properties_building_id"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT IF EXISTS "UQ_booking_requests_property_tenant"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD COLUMN IF NOT EXISTS "occupation" character varying`);
        
        // Migrate occupation data from tenant_profiles to preferences
        await queryRunner.query(`
            UPDATE preferences 
            SET occupation = tp.occupation 
            FROM tenant_profiles tp 
            INNER JOIN users u ON u.id = tp."userId" 
            WHERE preferences.user_id = u.id 
            AND tp.occupation IS NOT NULL
        `);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`
DO $$
BEGIN
  ALTER TABLE "booking_requests" ADD CONSTRAINT "UQ_9ba3da4fd4396cb4555855222ca" UNIQUE ("property_id", "tenant_id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
        `);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" ADD CONSTRAINT "FK_1cf1047690c039fa3d5239b6755" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_20e76d72eee4ecda54da1ac1d06" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_de6b5dcbd7710920cc0baa2367b" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT IF EXISTS "FK_de6b5dcbd7710920cc0baa2367b"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT IF EXISTS "FK_20e76d72eee4ecda54da1ac1d06"`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" DROP CONSTRAINT IF EXISTS "FK_1cf1047690c039fa3d5239b6755"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT IF EXISTS "UQ_9ba3da4fd4396cb4555855222ca"`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" ADD "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        // Note: We don't restore occupation data to tenant_profiles in rollback
        // as this would be a destructive operation
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN IF EXISTS "occupation"`);
        await queryRunner.query(`
DO $$
BEGIN
  ALTER TABLE "booking_requests" ADD CONSTRAINT "UQ_booking_requests_property_tenant" UNIQUE ("property_id", "tenant_id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_building_id" ON "properties" ("building_id") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_operator_id" ON "properties" ("operator_id") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_available_from" ON "properties" ("available_from") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_amenities" ON "properties" ("amenities") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_tenant_types" ON "properties" ("tenant_types") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_furnishing" ON "properties" ("furnishing") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_property_type" ON "properties" ("property_type") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_bathrooms" ON "properties" ("bathrooms") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_bedrooms" ON "properties" ("bedrooms") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_properties_price" ON "properties" ("price") `);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_booking_requests_tenant" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_booking_requests_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_cvs" ADD CONSTRAINT "FK_tenant_cvs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
