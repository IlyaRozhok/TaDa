import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * A viewing becomes an appointment, not just a pipeline status (package C1).
 *
 * "viewing" was a dropdown label with no date attached — nothing recorded
 * WHEN the viewing is, and the tenant had nothing to confirm. The operator
 * proposes a slot (`proposed_viewing_at`), the tenant confirms it
 * (`viewing_confirmed_at`); both feed the new transactional emails.
 */
export class AddViewingToBookingRequests1787800000000
  implements MigrationInterface
{
  name = "AddViewingToBookingRequests1787800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD "proposed_viewing_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD "viewing_confirmed_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP COLUMN "viewing_confirmed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP COLUMN "proposed_viewing_at"`,
    );
  }
}
