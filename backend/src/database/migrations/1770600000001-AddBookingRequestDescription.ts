import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBookingRequestDescription1770600000001
  implements MigrationInterface
{
  name = "AddBookingRequestDescription1770600000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD "description" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_requests" DROP COLUMN "description"`,
    );
  }
}
