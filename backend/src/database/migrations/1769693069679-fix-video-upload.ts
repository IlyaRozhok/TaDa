import { MigrationInterface, QueryRunner } from "typeorm";

export class FixVideoUpload1769693069679 implements MigrationInterface {
    name = 'FixVideoUpload1769693069679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" ADD "video" character varying`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "documents" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "documents"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "video"`);
    }

}
