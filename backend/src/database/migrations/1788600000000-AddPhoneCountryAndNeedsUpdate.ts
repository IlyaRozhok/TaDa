import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phone handling, phase 1 — two additive columns on `users`:
 *
 * - `phone_country` (varchar(2), nullable): the ISO country of `phone`,
 *   written by the API alongside the E.164 number on every save. Existing
 *   rows stay NULL until their phone is next saved or the backfill runs.
 * - `phone_needs_update` (boolean, NOT NULL DEFAULT false): the flag the
 *   planned backfill script sets on a stored number it cannot normalise.
 *   Nothing reads it yet. A constant default makes this a metadata-only
 *   change on Postgres 11+, with no table rewrite.
 *
 * NO DATA IS TOUCHED — and deliberately no CHECK constraint on `phone`.
 * Existing rows still hold pre-E.164 formats ("+447041 23079", masked
 * "+380(93)399-91-81", "" for a cleared phone), so the constraint would fail
 * to add. Adding it NOT VALID is not a way round that: Postgres checks a CHECK
 * on every UPDATE of a row, so any write to a legacy row — the refresh-token
 * rotation on every sign-in included — would start failing. The constraint
 * belongs in its own migration, after the backfill has rewritten those rows.
 */
export class AddPhoneCountryAndNeedsUpdate1788600000000 implements MigrationInterface {
  name = "AddPhoneCountryAndNeedsUpdate1788600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_country" character varying(2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_needs_update" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_needs_update"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_country"`);
  }
}
