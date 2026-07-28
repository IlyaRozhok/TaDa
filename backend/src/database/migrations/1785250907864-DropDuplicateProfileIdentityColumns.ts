import { MigrationInterface, QueryRunner } from "typeorm";

export class DropDuplicateProfileIdentityColumns1785250907864 implements MigrationInterface {
    name = 'DropDuplicateProfileIdentityColumns1785250907864'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN "full_name"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN "date_of_birth"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN "nationality"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP COLUMN "full_name"`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP COLUMN "date_of_birth"`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP COLUMN "nationality"`);
        await queryRunner.query(`ALTER TABLE "buildings" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" ADD "nationality" character varying`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" ADD "date_of_birth" date`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" ADD "full_name" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "last_name" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "first_name" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "nationality" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "date_of_birth" date`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "full_name" character varying`);
    }

}
