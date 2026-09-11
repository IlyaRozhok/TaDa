import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Call requests gain a handled state: `handled_at` is the moment an admin
 * marked the request as called back, null while it still waits. Nullable
 * timestamp rather than a boolean so the listing can show who was already
 * contacted and when — with no visitor account behind the form, the admin
 * callback is the whole funnel.
 *
 * Existing rows stay NULL (open): nothing recorded a callback before this
 * column existed, so "unknown" honestly maps to "not marked handled".
 */
export class AddHandledAtToCallRequests1788600000000
  implements MigrationInterface
{
  name = "AddHandledAtToCallRequests1788600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_requests" ADD "handled_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_requests" DROP COLUMN "handled_at"`,
    );
  }
}
