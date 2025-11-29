import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameDescriptionToDescriptions1764408089074 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename description column to descriptions to match frontend
        await queryRunner.query(`ALTER TABLE "properties" RENAME COLUMN "description" TO "descriptions"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rename descriptions back to description
        await queryRunner.query(`ALTER TABLE "properties" RENAME COLUMN "descriptions" TO "description"`);
    }

}
