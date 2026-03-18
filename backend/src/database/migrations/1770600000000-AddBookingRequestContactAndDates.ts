import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBookingRequestContactAndDates1770600000000
  implements MigrationInterface
{
  name = "AddBookingRequestContactAndDates1770600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD "date_from" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD "date_to" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD "email" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD "phone_number" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP COLUMN "phone_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP COLUMN "email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP COLUMN "date_to"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP COLUMN "date_from"`,
    );
  }
}
