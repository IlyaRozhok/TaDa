import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Operator-owned FKs go CASCADE -> RESTRICT (package G1).
 *
 * `properties.operator_id -> users` and `buildings.operator_id -> users` both
 * cascaded, so one admin click on "delete user" for an operator irreversibly
 * wiped their whole catalogue and, through the booking FKs, every tenant's
 * booking history on it — the exact outcome the building->property FK was
 * deliberately changed to SET NULL to prevent. `operator_id` is NOT NULL on
 * both tables, so SET NULL is not available here; RESTRICT plus a service
 * guard (409 with an actionable message) is the safe shape.
 *
 * The FK names are looked up instead of hardcoded: the hosts' constraint
 * names come from different generations of migrations, and a name mismatch
 * must fail loudly, not silently skip the change.
 */
export class RestrictOperatorOwnedCascades1788400000000
  implements MigrationInterface
{
  name = "RestrictOperatorOwnedCascades1788400000000";

  private async findFkName(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<string> {
    const rows: { constraint_name: string }[] = await queryRunner.query(
      `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = current_schema()
          AND tc.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = $2`,
      [table, column],
    );
    if (rows.length !== 1) {
      throw new Error(
        `Expected exactly one FK on ${table}.${column}, found ${rows.length}`,
      );
    }
    return rows[0].constraint_name;
  }

  private async rebuildFk(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    onDelete: "CASCADE" | "RESTRICT",
  ): Promise<void> {
    const fkName = await this.findFkName(queryRunner, table, column);
    await queryRunner.query(
      `ALTER TABLE "${table}" DROP CONSTRAINT "${fkName}"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${fkName}"
         FOREIGN KEY ("${column}") REFERENCES "users"("id")
         ON DELETE ${onDelete} ON UPDATE NO ACTION`,
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.rebuildFk(queryRunner, "properties", "operator_id", "RESTRICT");
    await this.rebuildFk(queryRunner, "buildings", "operator_id", "RESTRICT");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.rebuildFk(queryRunner, "properties", "operator_id", "CASCADE");
    await this.rebuildFk(queryRunner, "buildings", "operator_id", "CASCADE");
  }
}
