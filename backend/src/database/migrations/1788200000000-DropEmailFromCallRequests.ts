import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drops the leftover `call_requests.email` column.
 *
 * The form stopped asking for an email and the column was removed from the
 * entity — but it was also removed by editing the create migration
 * (1788000000000) in place, which is a no-op on any database that had already
 * run it. Stage (and possibly production) therefore kept an `email NOT NULL`
 * column that no code writes any more, so every POST /api/call-requests failed
 * with a not-null violation. Only a new forward migration reaches those
 * databases.
 *
 * `IF EXISTS` because the two cases have to converge: on stage/prod the column
 * is there, on a database migrated after the in-place edit it never existed.
 *
 * `down()` restores the column nullable, not NOT NULL as it originally was.
 * Re-adding the constraint would fail the moment the table holds a row, and
 * the values are gone regardless — the shape comes back, the data does not.
 */
export class DropEmailFromCallRequests1788200000000
  implements MigrationInterface
{
  name = "DropEmailFromCallRequests1788200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_requests" DROP COLUMN IF EXISTS "email"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_requests" ADD "email" character varying(254)`,
    );
  }
}
