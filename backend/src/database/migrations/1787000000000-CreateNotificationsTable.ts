import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Durable outbox for internal notifications. Purely additive: a new table and
 * a new enum type, nothing existing is touched.
 */
export class CreateNotificationsTable1787000000000
  implements MigrationInterface
{
  name = "CreateNotificationsTable1787000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'sent', 'failed')`,
    );

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying(64) NOT NULL,
        "dedupe_key" character varying(255) NOT NULL,
        "channel" character varying(32) NOT NULL,
        "recipient" character varying(320) NOT NULL,
        "subject" character varying(255) NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "sent_at" TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notifications_dedupe_key" UNIQUE ("dedupe_key")
      )
    `);

    // The retry sweep filters on status; without this it is a sequential scan
    // over every notification ever sent, every five minutes, forever.
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_status" ON "notifications" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_notifications_status"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
  }
}
