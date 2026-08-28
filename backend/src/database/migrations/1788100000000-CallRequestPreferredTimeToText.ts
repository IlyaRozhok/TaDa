import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * "Preferred time" stopped being a closed multiselect and became a plain text
 * field, so `call_requests.preferred_times` (jsonb array of slugs) gives way to
 * `preferred_time` (varchar).
 *
 * A drop-and-add rather than a cast: the column shipped days ago and holds no
 * production rows, so there is nothing to translate from `["morning"]` into a
 * sentence, and inventing a cast expression for data that does not exist would
 * be a fiction the next reader has to verify. `down()` restores the jsonb
 * column on the same terms — the shape comes back, the values do not, because
 * free text is not reducible to the old slugs.
 */
export class CallRequestPreferredTimeToText1788100000000
  implements MigrationInterface
{
  name = "CallRequestPreferredTimeToText1788100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_requests" DROP COLUMN "preferred_times"`,
    );
    await queryRunner.query(
      `ALTER TABLE "call_requests" ADD "preferred_time" character varying(120)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_requests" DROP COLUMN "preferred_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "call_requests" ADD "preferred_times" jsonb`,
    );
  }
}
