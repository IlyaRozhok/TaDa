import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * `properties.building_id` FK: ON DELETE CASCADE → ON DELETE SET NULL.
 *
 * Deleting a building used to cascade into deleting all its properties,
 * which in turn cascaded into property media, shortlist rows and booking
 * requests — including `rented` ones, i.e. the record of a closed tenancy.
 * The service layer refuses to delete a building that still has properties,
 * but the schema is the last line of defence and it pointed the wrong way.
 *
 * SET NULL matches the intended semantics: a unit outlives its building
 * container and is simply detached (the "convert to private landlord" flow
 * already clears the link the same way; the column is nullable).
 *
 * The constraint name differs between environments (older migrations created
 * it under an auto-generated name), so it is looked up by definition rather
 * than hard-coded.
 */
export class BuildingDeleteDetachesProperties1787400000002
  implements MigrationInterface
{
  name = "BuildingDeleteDetachesProperties1787400000002";

  private async findConstraintName(
    queryRunner: QueryRunner,
  ): Promise<string | null> {
    const rows: Array<{ conname: string }> = await queryRunner.query(`
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_class frel ON frel.oid = con.confrelid
      WHERE con.contype = 'f'
        AND rel.relname = 'properties'
        AND frel.relname = 'buildings'
        AND (
          SELECT array_agg(att.attname)
          FROM unnest(con.conkey) AS k(attnum)
          JOIN pg_attribute att
            ON att.attrelid = con.conrelid AND att.attnum = k.attnum
        ) = ARRAY['building_id']::name[]
    `);
    return rows[0]?.conname ?? null;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const constraint = await this.findConstraintName(queryRunner);
    if (constraint) {
      await queryRunner.query(
        `ALTER TABLE "properties" DROP CONSTRAINT "${constraint}"`,
      );
    }
    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD CONSTRAINT "fk_properties_building_id"
      FOREIGN KEY ("building_id") REFERENCES "buildings"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraint = await this.findConstraintName(queryRunner);
    if (constraint) {
      await queryRunner.query(
        `ALTER TABLE "properties" DROP CONSTRAINT "${constraint}"`,
      );
    }
    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD CONSTRAINT "fk_properties_building_id"
      FOREIGN KEY ("building_id") REFERENCES "buildings"("id")
      ON DELETE CASCADE
    `);
  }
}
