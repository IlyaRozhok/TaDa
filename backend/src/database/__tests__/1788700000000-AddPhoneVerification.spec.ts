import { AddPhoneVerification1788700000000 } from "@/database/migrations/1788700000000-AddPhoneVerification";

/**
 * Pins the shape of the phase-3 migration without a database (it was also
 * run up and down against Postgres by hand): additive only, nothing
 * backfilled, and `down` undoes exactly what `up` did.
 */
function recorder() {
  const statements: string[] = [];
  const queryRunner = { query: jest.fn(async (sql: string) => statements.push(sql.replace(/\s+/g, " ").trim())) };
  return { statements, queryRunner: queryRunner as any };
}

describe("AddPhoneVerification1788700000000", () => {
  it("adds phone_verified_at as a nullable column with no backfill", async () => {
    const { statements, queryRunner } = recorder();
    await new AddPhoneVerification1788700000000().up(queryRunner);

    expect(statements[0]).toBe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMP WITH TIME ZONE`);
    expect(statements.join(" ")).not.toMatch(/NOT NULL DEFAULT now\(\), "phone_verified_at"|UPDATE "users"/);
  });

  it("makes a verified number unique to one account, verified rows only", async () => {
    const { statements, queryRunner } = recorder();
    await new AddPhoneVerification1788700000000().up(queryRunner);

    expect(statements).toContain(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_verified_phone" ON "users" ("phone") WHERE "phone_verified_at" IS NOT NULL`,
    );
  });

  it("creates the event ledger with no column for a code", async () => {
    const { statements, queryRunner } = recorder();
    await new AddPhoneVerification1788700000000().up(queryRunner);

    const table = statements.find((s) => s.startsWith(`CREATE TABLE IF NOT EXISTS "phone_verification_events"`)) ?? "";
    expect(table).toContain(`ON DELETE CASCADE`);
    expect(table).not.toMatch(/"code"|"otp"/);
    expect(statements.filter((s) => s.startsWith("CREATE INDEX"))).toHaveLength(3);
  });

  it("only adds: every statement on the way up is an ADD or a CREATE", async () => {
    const { statements, queryRunner } = recorder();
    await new AddPhoneVerification1788700000000().up(queryRunner);

    for (const statement of statements) {
      expect(statement).toMatch(/^(ALTER TABLE "users" ADD COLUMN IF NOT EXISTS |CREATE (UNIQUE )?INDEX IF NOT EXISTS |CREATE TABLE IF NOT EXISTS )/);
    }
  });

  it("down removes the table, the index and the column", async () => {
    const { statements, queryRunner } = recorder();
    await new AddPhoneVerification1788700000000().down(queryRunner);

    expect(statements).toEqual([
      `DROP TABLE IF EXISTS "phone_verification_events"`,
      `DROP INDEX IF EXISTS "uq_users_verified_phone"`,
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_verified_at"`,
    ]);
  });
});
