Markdown
# TaDa Rental Platform — Monorepo Rules

## Context-Aware Execution (AI Instruction)
Before generating any code or modifications:
1. Always parse `REFRACTORING_ROADMAP.md` first.
2. Ask the user which STAGE and FEATURE is the active target.
3. Keep the refactoring unified: handle Backend changes, Frontend organization, and Tests iteratively for that domain[cite: 1].

## Repository Layout
tada-prod/
├── backend/         # NestJS API[cite: 1]
├── frontend/        # Next.js 16 App Router[cite: 1]
├── infrastructure/  # Terraform[cite: 1]
└── REFRACTORING_ROADMAP.md # Refactoring sequence


## Core Refactoring Principles
* **Tests are Mandatory:** Write characterization/unit/integration tests alongside structural refactoring[cite: 1].
* **Clean As You Go:** Do not postpone cleaning. Move components into domain directories, transition axios to RTK Query, and delete unreachable dead code immediately[cite: 1, 2].
* **No Code Smells:** No commented-out code, no non-English logging/strings, no raw `console.log` statements[cite: 1].

## Global Invariants — Do Not Violate
* **TypeORM synchronize:** Must remain hardcoded to `false`. All database updates run strictly via migrations[cite: 1, 3].
* **Token Security:** Never store session tokens in `localStorage` or append them to URLs. Deliver/read strictly through httpOnly cookies[cite: 1, 2].
* **Error Handling:** Never swallow exceptions or provide fake data placeholders on infrastructure failures (AWS S3, Redis)[cite: 1, 3].