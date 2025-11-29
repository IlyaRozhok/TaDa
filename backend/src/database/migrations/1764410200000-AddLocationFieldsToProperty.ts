import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationFieldsToProperty1764410200000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add metro_stations, commute_times, local_essentials, concierge_hours, pets fields
        await queryRunner.query(`ALTER TABLE "properties" ADD "metro_stations" jsonb DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "commute_times" jsonb DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "local_essentials" jsonb DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "concierge_hours" jsonb`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "pets" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added fields
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "pets"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "concierge_hours"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "local_essentials"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "commute_times"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "metro_stations"`);
    }

}

