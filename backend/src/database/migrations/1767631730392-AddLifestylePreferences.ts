import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLifestylePreferences1767631730392 implements MigrationInterface {
    name = 'AddLifestylePreferences1767631730392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" ADD "family_status" character varying`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD "children_count" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "children_count"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "family_status"`);
    }

}
