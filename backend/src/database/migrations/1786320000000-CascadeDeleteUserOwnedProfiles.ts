import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Step 6.7 — entity ownership: make the four user-owned profile tables cascade
 * on delete at the database level.
 *
 * ---
 * WHAT WAS WRONG
 *
 * `User` declares its four owned rows with `cascade: true`:
 *
 *   @OneToOne(() => Preferences,     (p) => p.user, { cascade: true })
 *   @OneToOne(() => TenantProfile,   (t) => t.user, { cascade: true })
 *   @OneToOne(() => OperatorProfile, (o) => o.user, { cascade: true })
 *   @OneToOne(() => TenantCv,        (c) => c.user, { cascade: true })
 *
 * That flag governs what the ORM does when it *persists* a graph. It emits no
 * DDL whatsoever, so all four foreign keys were created with the Postgres
 * default, ON DELETE NO ACTION. Deleting a user row therefore raised a foreign
 * key violation, and the application compensated by deleting each child by
 * hand first. The scar was still in the code:
 *
 *   /** Удалить пользователя администратором
 *    *  Fixed: Added TenantCv deletion to handle FK constraint *\/
 *
 * The owning side of each relation now also carries `onDelete: "CASCADE"`,
 * which is the half that reaches the schema. This migration brings the four
 * existing constraints in line with it, so the database enforces the ownership
 * the entity model has always claimed.
 *
 * ---
 * NO DATA IS TOUCHED.
 *
 * Every statement here is constraint metadata. No row is inserted, updated or
 * deleted in either direction, and no column changes type, nullability or
 * default. The only observable difference is what Postgres does when a `users`
 * row is deleted from this point on.
 *
 * ---
 * WHY `NOT VALID` THEN `VALIDATE`, AND THE ONE CAVEAT
 *
 * A plain `ADD CONSTRAINT ... FOREIGN KEY` holds SHARE ROW EXCLUSIVE on the
 * child table *while it scans every row* to prove the constraint holds. On a
 * large populated table that blocks writes for the length of the scan.
 *
 * Splitting it avoids that: `ADD CONSTRAINT ... NOT VALID` is O(1) metadata,
 * and `VALIDATE CONSTRAINT` does the scan under SHARE UPDATE EXCLUSIVE, which
 * permits concurrent INSERT/UPDATE/DELETE.
 *
 * ⚠️ CAVEAT, stated plainly: the data source runs migrations with
 * `migrationsTransactionMode: "each"`, so this whole migration is ONE
 * transaction. Locks are held until it commits, which means the split does not
 * actually shorten the blocking window here — the ACCESS EXCLUSIVE taken by
 * DROP/ADD CONSTRAINT is held to the end regardless. The split still buys two
 * real things: the expensive scan runs under the weaker lock mode, and the
 * statements are already in the shape an operator needs if they ever have to
 * run them by hand, outside a transaction, against a big live table. On the
 * current data (12 users, ≤10 rows in each child table) the whole thing is
 * instant either way.
 *
 * ---
 * REVERSIBILITY
 *
 * `down()` drops each constraint and re-adds it with no ON DELETE clause,
 * which is exactly ON DELETE NO ACTION — the state before this migration. The
 * constraint names are preserved verbatim in both directions, because they are
 * the hashes TypeORM derives from (table, column) and expects to find; using
 * fresh names would leave `schema:log` permanently dirty.
 */
export class CascadeDeleteUserOwnedProfiles1786320000000
  implements MigrationInterface
{
  name = "CascadeDeleteUserOwnedProfiles1786320000000";

  /**
   * (table, constraint name, referencing column) for the four user-owned rows.
   * The names are TypeORM's own and must not be regenerated.
   */
  private static readonly FKS: ReadonlyArray<
    readonly [table: string, constraint: string, column: string]
  > = [
    ["preferences", "FK_34a542d34f1c75c43e78df2e67a", "user_id"],
    ["tenant_profiles", "FK_b8a59063604d0b6d659548da5a9", "userId"],
    ["operator_profiles", "FK_7a8bd6902d3eff8546548e6e69e", "userId"],
    ["tenant_cvs", "FK_1cf1047690c039fa3d5239b6755", "user_id"],
  ];

  private async rebuild(
    queryRunner: QueryRunner,
    onDeleteCascade: boolean
  ): Promise<void> {
    const onDelete = onDeleteCascade ? " ON DELETE CASCADE" : "";

    for (const [table, constraint, column] of CascadeDeleteUserOwnedProfiles1786320000000.FKS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "${constraint}"`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" ` +
          `FOREIGN KEY ("${column}") REFERENCES "users"("id")` +
          `${onDelete} ON UPDATE NO ACTION NOT VALID`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" VALIDATE CONSTRAINT "${constraint}"`
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.rebuild(queryRunner, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.rebuild(queryRunner, false);
  }
}
