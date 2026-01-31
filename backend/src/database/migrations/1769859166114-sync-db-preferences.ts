import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncDbPreferences1769859166114 implements MigrationInterface {
    name = 'SyncDbPreferences1769859166114'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" ALTER COLUMN "flexible_budget" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" ALTER COLUMN "flexible_budget" DROP DEFAULT`);
    }

}
