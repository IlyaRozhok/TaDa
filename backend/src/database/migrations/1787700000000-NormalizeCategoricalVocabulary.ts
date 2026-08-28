import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Normalize categorical values to the governed vocabulary
 * (`src/common/constants/vocabulary.ts`, package B3).
 *
 * The matching engine compares these fields by exact lowercase string
 * equality, and three spellings of "part furnished" plus two of co-living
 * were in circulation — every drifted variant silently scored as "no match"
 * instead of erroring. DTO validation now blocks new variants; this
 * migration repairs what is already stored.
 *
 * `down` is a deliberate no-op: the original spellings are not recoverable
 * and restoring them would only re-corrupt the ranking.
 */
export class NormalizeCategoricalVocabulary1787700000000
  implements MigrationInterface
{
  name = "NormalizeCategoricalVocabulary1787700000000";

  /** Same alias → canonical table as the vocabulary module. */
  private static readonly SCALAR_ALIASES: Array<[string, string]> = [
    ["part-furnished", "part_furnished"],
    ["partially_furnished", "part_furnished"],
    ["partially-furnished", "part_furnished"],
    ["co-living", "co_living"],
    ["en-suite room", "room"],
    ["en_suite_room", "room"],
  ];

  /** Duration tokens live inside comma-separated lists — replaced textually. */
  private static readonly DURATION_REPLACEMENTS: Array<[string, string]> = [
    ["12 months", "12_months"],
    ["6 months", "6_months"],
    ["12-months", "12_months"],
    ["6-months", "6_months"],
    ["short-term", "short_term"],
    ["medium-term", "medium_term"],
    ["long-term", "long_term"],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- properties: scalar columns -------------------------------------
    for (const column of ["furnishing", "building_type", "property_type", "bills"]) {
      await queryRunner.query(
        `UPDATE "properties" SET "${column}" = LOWER(TRIM("${column}"))
         WHERE "${column}" IS NOT NULL AND "${column}" <> LOWER(TRIM("${column}"))`,
      );
      for (const [alias, canonical] of NormalizeCategoricalVocabulary1787700000000.SCALAR_ALIASES) {
        await queryRunner.query(
          `UPDATE "properties" SET "${column}" = $2 WHERE "${column}" = $1`,
          [alias, canonical],
        );
      }
    }

    // --- properties: let_duration (comma-separated list) ----------------
    await queryRunner.query(
      `UPDATE "properties" SET "let_duration" = LOWER(TRIM("let_duration"))
       WHERE "let_duration" IS NOT NULL AND "let_duration" <> LOWER(TRIM("let_duration"))`,
    );
    for (const [alias, canonical] of NormalizeCategoricalVocabulary1787700000000.DURATION_REPLACEMENTS) {
      await queryRunner.query(
        `UPDATE "properties" SET "let_duration" = REPLACE("let_duration", $1, $2)
         WHERE "let_duration" LIKE '%' || $1 || '%'`,
        [alias, canonical],
      );
    }

    // Canonical lists carry no whitespace around the commas.
    await queryRunner.query(
      `UPDATE "properties" SET "let_duration" = regexp_replace("let_duration", '\\s*,\\s*', ',', 'g')
       WHERE "let_duration" LIKE '% %'`,
    );

    // --- preferences: scalar columns ------------------------------------
    await queryRunner.query(
      `UPDATE "preferences" SET "bills" = LOWER(TRIM("bills"))
       WHERE "bills" IS NOT NULL AND "bills" <> LOWER(TRIM("bills"))`,
    );
    await queryRunner.query(
      `UPDATE "preferences" SET "let_duration" = LOWER(TRIM("let_duration"))
       WHERE "let_duration" IS NOT NULL AND "let_duration" <> LOWER(TRIM("let_duration"))`,
    );
    for (const [alias, canonical] of NormalizeCategoricalVocabulary1787700000000.DURATION_REPLACEMENTS) {
      await queryRunner.query(
        `UPDATE "preferences" SET "let_duration" = REPLACE("let_duration", $1, $2)
         WHERE "let_duration" LIKE '%' || $1 || '%'`,
        [alias, canonical],
      );
    }

    await queryRunner.query(
      `UPDATE "preferences" SET "let_duration" = regexp_replace("let_duration", '\\s*,\\s*', ',', 'g')
       WHERE "let_duration" LIKE '% %'`,
    );

    // --- preferences: jsonb string arrays, element-wise -----------------
    // Rebuilds each array with lowered elements mapped through the alias
    // table; ORDER BY ordinality keeps the user's original element order.
    const aliasCases = NormalizeCategoricalVocabulary1787700000000.SCALAR_ALIASES
      .map(([alias, canonical]) => `WHEN '${alias}' THEN '${canonical}'`)
      .join(" ");

    for (const column of ["furnishing", "building_types", "property_types"]) {
      await queryRunner.query(`
        UPDATE "preferences" SET "${column}" = (
          SELECT COALESCE(
            jsonb_agg(
              to_jsonb(CASE LOWER(TRIM(t.el)) ${aliasCases} ELSE LOWER(TRIM(t.el)) END)
              ORDER BY t.ord
            ),
            '[]'::jsonb
          )
          FROM jsonb_array_elements_text("${column}") WITH ORDINALITY AS t(el, ord)
        )
        WHERE "${column}" IS NOT NULL
          AND jsonb_typeof("${column}") = 'array'
          AND jsonb_array_length("${column}") > 0
      `);
    }
  }

  public async down(): Promise<void> {
    // Deliberate no-op: original variant spellings are gone by design.
  }
}
