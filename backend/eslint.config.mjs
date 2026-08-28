// Backend ESLint — flat config (ESLint 9).
//
// Philosophy, mirroring the frontend config: errors gate CI, warnings are the
// visible backlog. The codebase predates linting, so stylistic rules the code
// violates in bulk start as "warn"; tighten them rule by rule in dedicated
// PRs, not by reformatting the world here.
//
// `no-unused-vars` is an ERROR on purpose: it is the machine check for the
// CLAUDE.md rule "remove imports that your edit orphaned", which until now
// relied on the owner reading diffs line by line.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "jest.config.ts"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          // Nest DI sometimes needs a constructor param only for its type;
          // prefix intentionally-unused things with _ to keep them.
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      // 38 pre-existing occurrences — backlog, not a gate (yet).
      "@typescript-eslint/no-explicit-any": "warn",
      // Migrations log with console on purpose; application code must not.
      "no-console": "warn",
    },
  },
  {
    files: ["src/database/migrations/**"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
