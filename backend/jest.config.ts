import type { Config } from "jest";

/**
 * Unit-test configuration.
 *
 * Scope: pure functions, mappers, and services with mocked repositories.
 * These run without a database. Integration/e2e tests that need Postgres
 * live under `test/` with their own config and are not part of `npm test`.
 */
const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        // The app tsconfig targets NestJS decorators; reuse it so tests
        // compile identically to production code.
        tsconfig: "<rootDir>/../tsconfig.json",
      },
    ],
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default config;
