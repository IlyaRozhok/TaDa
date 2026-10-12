import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phone verification by SMS (phase 3). All additive:
 *
 * 1. `users.phone_verified_at` (timestamptz, nullable). Every existing user
 *    gets NULL, so once PHONE_VERIFICATION_REQUIRED is turned on everyone
 *    verifies at their next sign-in. Nothing is backfilled.
 *
 * 2. `uq_users_verified_phone`: a partial unique index on `users.phone` for
 *    verified rows only — one verified number, one account, guaranteed by the
 *    database rather than by a check-then-write race. It builds safely today:
 *    no row is verified yet, so no existing duplicate can block it, and
 *    unverified (legacy) phones stay outside its scope.
 *
 * 3. `phone_verification_events`: one row per code sent and per code checked,
 *    the ledger the rate limits are counted from. It holds numbers, outcomes,
 *    user and IP — never a code. Rows go with their user (ON DELETE CASCADE).
 */
export class AddPhoneVerification1788700000000 implements MigrationInterface {
  name = "AddPhoneVerification1788700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_verified_phone" ON "users" ("phone") WHERE "phone_verified_at" IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "phone_verification_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying(8) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "user_id" uuid,
        "ip" character varying(64),
        "outcome" character varying(24) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_phone_verification_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_phone_verification_events_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_phone_verification_events_phone" ON "phone_verification_events" ("phone", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_phone_verification_events_user" ON "phone_verification_events" ("user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_phone_verification_events_ip" ON "phone_verification_events" ("ip", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "phone_verification_events"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_verified_phone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_verified_at"`);
  }
}
