import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Records when a tenant finished onboarding.
 *
 * Nullable with no backfill on purpose: existing CVs were created before the
 * flow had a completion step, and inventing a timestamp for them would fire a
 * "CV completed" notification for every account already in the database.
 */
export class AddCompletedAtToTenantCvs1787000000001
  implements MigrationInterface
{
  name = "AddCompletedAtToTenantCvs1787000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_cvs" ADD "completed_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_cvs" DROP COLUMN "completed_at"`,
    );
  }
}
