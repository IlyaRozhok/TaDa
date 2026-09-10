import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The "Book a call" form gained a preferred-contact-method field, and with it
 * a second contact channel: `email` collects an address instead of a phone
 * number, `voice_call`/`video_call` keep collecting the phone.
 *
 * Three column changes fall out of that:
 *
 * 1. `contact_method` is added nullable, backfilled, then made NOT NULL.
 *    Adding it NOT NULL in one step would fail on any database that already
 *    holds rows. Every existing row predates the field and was a phone
 *    submission by construction — the form had no other channel — so
 *    'voice_call' is the honest backfill, not a placeholder. Once no NULLs
 *    remain the constraint is safe, and the column then matches the entity,
 *    which declares it NOT NULL.
 *
 * 2. `email` comes back, nullable. It was dropped by 1788200000000 because the
 *    form stopped asking; it now asks again, but only for one of the three
 *    methods, so nullable is the correct shape rather than the NOT NULL it
 *    originally had.
 *
 * 3. The phone pair loses NOT NULL. An email-method submission carries no
 *    phone number at all, and a NOT NULL column would reject it.
 *
 * `down()` reverses 1 and 2 completely. It deliberately leaves the phone pair
 * nullable — the same call 1788200000000's `down()` made about `email`:
 * restoring NOT NULL would fail on any row written while the email method
 * existed, and those rows have no phone number to restore.
 */
export class AddContactMethodToCallRequests1788500000000
  implements MigrationInterface
{
  name = "AddContactMethodToCallRequests1788500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_requests" ADD "contact_method" character varying(16)`,
    );
    await queryRunner.query(
      `UPDATE "call_requests" SET "contact_method" = 'voice_call' WHERE "contact_method" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "call_requests" ALTER COLUMN "contact_method" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "call_requests" ADD "email" character varying(254)`,
    );

    await queryRunner.query(
      `ALTER TABLE "call_requests" ALTER COLUMN "phone_country_code" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "call_requests" ALTER COLUMN "phone_number" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "call_requests" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "call_requests" DROP COLUMN "contact_method"`,
    );
  }
}
