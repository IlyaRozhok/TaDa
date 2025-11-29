import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInheritedFieldsToProperty1764410121569 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make building_id nullable for private landlord properties
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "building_id" DROP NOT NULL`);

        // Add inherited fields from building to properties
        await queryRunner.query(`ALTER TABLE "properties" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "tenant_types" jsonb DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "amenities" jsonb DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "is_concierge" boolean`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "pet_policy" boolean`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "smoking_area" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added fields
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "smoking_area"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "pet_policy"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "is_concierge"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "amenities"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "tenant_types"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "address"`);

        // Make building_id not nullable again
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "building_id" SET NOT NULL`);
    }

}
