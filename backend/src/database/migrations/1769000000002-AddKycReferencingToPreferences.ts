import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKycReferencingToPreferences1769000000002 implements MigrationInterface {
    name = 'AddKycReferencingToPreferences1769000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" ADD "kyc_status" character varying`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "referencing_status" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "referencing_status"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "kyc_status"`);
    }
}
