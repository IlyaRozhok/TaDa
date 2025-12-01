import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorPreferences1764616517157 implements MigrationInterface {
    name = 'RefactorPreferences1764616517157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" ADD "preferred_address" character varying`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "preferred_metro_stations" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "preferred_essentials" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "preferred_commute_times" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "deposit_preference" character varying`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "property_types" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "bedrooms" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "bathrooms" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "outdoor_space" boolean`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "balcony" boolean`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "terrace" boolean`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "min_square_meters" integer`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "max_square_meters" integer`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "building_types" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "bills" character varying`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "tenant_types" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "pet_policy" boolean`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "number_of_pets" integer`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "amenities" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "is_concierge" boolean`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "smoking_area" boolean`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "furnishing"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "furnishing" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "pets"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "pets" jsonb`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "hobbies"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "hobbies" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "ideal_living_environment"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "ideal_living_environment" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "property_type"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "property_type" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "building_style"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "building_style" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "lifestyle_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "lifestyle_features" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "social_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "social_features" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "work_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "work_features" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "convenience_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "convenience_features" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "pet_friendly_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "pet_friendly_features" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "luxury_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "luxury_features" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_0bfd8f2ef727798734b537ef222"`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "luxury" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "outdoor_space" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "balcony" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "terrace" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "operator_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_0bfd8f2ef727798734b537ef222" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_0bfd8f2ef727798734b537ef222"`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "operator_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "terrace" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "balcony" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "outdoor_space" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "luxury" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_0bfd8f2ef727798734b537ef222" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "luxury_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "luxury_features" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "pet_friendly_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "pet_friendly_features" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "convenience_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "convenience_features" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "work_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "work_features" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "social_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "social_features" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "lifestyle_features"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "lifestyle_features" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "building_style"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "building_style" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "property_type"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "property_type" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "ideal_living_environment"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "ideal_living_environment" json`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "hobbies"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "hobbies" text array`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "pets"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "pets" character varying`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "furnishing"`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "furnishing" character varying`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "smoking_area"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "is_concierge"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "amenities"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "number_of_pets"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "pet_policy"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "tenant_types"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "bills"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "building_types"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "max_square_meters"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "min_square_meters"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "terrace"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "balcony"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "outdoor_space"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "bathrooms"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "bedrooms"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "property_types"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "deposit_preference"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "preferred_commute_times"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "preferred_essentials"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "preferred_metro_stations"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "preferred_address"`);
    }

}
