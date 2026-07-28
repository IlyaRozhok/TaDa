import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokenHashToUsers1785246923429 implements MigrationInterface {
    name = 'AddRefreshTokenHashToUsers1785246923429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refresh_token_hash" character varying`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "refresh_token_hash"`,
        );
    }
}
