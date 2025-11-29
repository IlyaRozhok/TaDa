import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLuxuryFieldToProperty1764409410641 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" ADD "luxury" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "luxury"`);
    }

}
