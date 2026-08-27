import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Durable record of "Book a call" submissions from the public landings.
 * Purely additive: one new table, nothing existing is touched.
 *
 * `reason` and `source` are plain varchar rather than enum types on purpose.
 * The reason vocabulary is a product list that grows with the landing copy;
 * an enum would turn every new option into a migration with an `ALTER TYPE`
 * that cannot be rolled back inside a transaction. The closed list is enforced
 * by the DTO, where it belongs.
 */
export class CreateCallRequestsTable1788000000000 implements MigrationInterface {
  name = "CreateCallRequestsTable1788000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "call_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reason" character varying(64) NOT NULL,
        "name" character varying(200) NOT NULL,
        "email" character varying(254) NOT NULL,
        "phone_country_code" character varying(2) NOT NULL,
        "phone_number" character varying(32) NOT NULL,
        "preferred_times" jsonb,
        "notes" text,
        "source" character varying(16) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_call_requests" PRIMARY KEY ("id")
      )
    `);

    // The admin panel lists newest-first and filters by landing; both are
    // sequential scans without these once the table outgrows a page.
    await queryRunner.query(
      `CREATE INDEX "idx_call_requests_created_at" ON "call_requests" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_call_requests_source" ON "call_requests" ("source")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_call_requests_source"`);
    await queryRunner.query(`DROP INDEX "public"."idx_call_requests_created_at"`);
    await queryRunner.query(`DROP TABLE "call_requests"`);
  }
}
