import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * EPC band on properties (package C2).
 *
 * Displaying the EPC rating on an advertisement is a legal requirement in
 * England and Wales, and MEES bans letting below band E — yet the schema had
 * no field for it at all. Nullable: pre-existing listings carry no value
 * until their operator supplies one; the DTO constrains new writes to A-G.
 */
export class AddPropertyEpcRating1788100000000 implements MigrationInterface {
  name = "AddPropertyEpcRating1788100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "epc_rating" character varying(2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN "epc_rating"`,
    );
  }
}
