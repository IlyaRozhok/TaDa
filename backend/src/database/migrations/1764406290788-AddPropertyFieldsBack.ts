import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyFieldsBack1764406290788 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add back property fields that were removed
        await queryRunner.query(`ALTER TABLE "properties" ADD "property_type" character varying`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "furnishing" character varying`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "bills" character varying DEFAULT 'excluded'`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "available_from" date`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "building_type" character varying`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "let_duration" character varying`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "floor" integer`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "square_meters" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "outdoor_space" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "balcony" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "terrace" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added fields
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "terrace"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "balcony"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "outdoor_space"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "square_meters"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "floor"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "let_duration"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "building_type"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "available_from"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "bills"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "furnishing"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "property_type"`);
    }

}
