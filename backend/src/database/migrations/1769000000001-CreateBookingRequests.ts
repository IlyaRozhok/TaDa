import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookingRequests1769000000001 implements MigrationInterface {
  name = "CreateBookingRequests1769000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."booking_requests_status_enum" AS ENUM('new', 'contacting', 'kyc_referencing', 'approved_viewing', 'viewing', 'contract', 'deposit', 'full_payment', 'move_in', 'rented', 'cancel_booking')`
    );
    await queryRunner.query(
      `CREATE TABLE "booking_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "property_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "status" "public"."booking_requests_status_enum" NOT NULL DEFAULT 'new', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_booking_requests_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_booking_requests_property_tenant" UNIQUE ("property_id", "tenant_id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_booking_requests_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_booking_requests_tenant" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP CONSTRAINT "FK_booking_requests_tenant"`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP CONSTRAINT "FK_booking_requests_property"`
    );
    await queryRunner.query(`DROP TABLE "booking_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."booking_requests_status_enum"`
    );
  }
}
