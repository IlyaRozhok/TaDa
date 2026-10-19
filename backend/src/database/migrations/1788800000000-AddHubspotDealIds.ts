import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HubSpot CRM sync: one nullable column on each request table that can turn
 * into a deal, holding the HubSpot deal id once it is created. It is what
 * keeps the sync from creating a second deal when the event is replayed or
 * retried. Additive and idempotent (IF NOT EXISTS), no data touched.
 */
export class AddHubspotDealIds1788800000000 implements MigrationInterface {
  name = "AddHubspotDealIds1788800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_requests" ADD COLUMN IF NOT EXISTS "hubspot_deal_id" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD COLUMN IF NOT EXISTS "hubspot_deal_id" character varying(32)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "booking_requests" DROP COLUMN IF EXISTS "hubspot_deal_id"`);
    await queryRunner.query(`ALTER TABLE "call_requests" DROP COLUMN IF EXISTS "hubspot_deal_id"`);
  }
}
