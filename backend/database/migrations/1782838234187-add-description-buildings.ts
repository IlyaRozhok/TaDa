import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionBuildings1782838234187 implements MigrationInterface {
    name = 'AddDescriptionBuildings1782838234187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT "FK_booking_requests_property"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT "FK_booking_requests_tenant"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT "UQ_booking_requests_property_tenant"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "UQ_9ba3da4fd4396cb4555855222ca" UNIQUE ("tenant_id", "property_id")`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_20e76d72eee4ecda54da1ac1d06" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_de6b5dcbd7710920cc0baa2367b" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT "FK_de6b5dcbd7710920cc0baa2367b"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT "FK_20e76d72eee4ecda54da1ac1d06"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" DROP CONSTRAINT "UQ_9ba3da4fd4396cb4555855222ca"`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "UQ_booking_requests_property_tenant" UNIQUE ("property_id", "tenant_id")`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_booking_requests_tenant" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_requests" ADD CONSTRAINT "FK_booking_requests_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
