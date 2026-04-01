import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyFeaturesAmenitites1775055918056 implements MigrationInterface {
    name = 'AddPropertyFeaturesAmenitites1775055918056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" ADD "property_amenities" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "property_amenities" jsonb DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "property_amenities"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "property_amenities"`);
    }

}
