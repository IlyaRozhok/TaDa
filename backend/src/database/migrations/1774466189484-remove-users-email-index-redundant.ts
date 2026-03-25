import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUsersEmailIndexRedundant1774466189484 implements MigrationInterface {
    name = 'RemoveUsersEmailIndexRedundant1774466189484'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
    }

}
