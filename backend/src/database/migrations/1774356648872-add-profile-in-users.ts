import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileInUsers1774356648872 implements MigrationInterface {
    name = 'AddProfileInUsers1774356648872'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "is_concierge"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "concierge_hours"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "first_name" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_name" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "date_of_birth" date`);
        await queryRunner.query(`ALTER TABLE "users" ADD "nationality" character varying`);
        await queryRunner.query(`ALTER TABLE "property_media" ADD "thumbnail_url" character varying`);
        await queryRunner.query(`ALTER TABLE "property_media" ADD "medium_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "property_media" DROP COLUMN "medium_url"`);
        await queryRunner.query(`ALTER TABLE "property_media" DROP COLUMN "thumbnail_url"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nationality"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "date_of_birth"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "concierge_hours" jsonb`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "is_concierge" boolean`);
    }

}
