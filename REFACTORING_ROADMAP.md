# TaDa Rental Platform — Abstract Refactoring Roadmap

This document defines the strategic, step-by-step sequence for cleaning the codebase. We move sequentially through the User Journey. Each feature must be refactored inside an isolated branch, thoroughly cleaned, and paired with tests.

## Meta-Instructions for the AI (Refactoring Philosophy)
1. **Investigate First:** Before changing any code, trace the current execution flow. Identify exactly what is active and what is dead weight.
2. **Preserve & Purge:** Retain all active business logic. Aggressively delete unused files, duplicate components, obsolete axios calls, and dev artifacts belonging to the current scope.
3. **Propose Architecture Mid-Flight:** Stop and present architectural choices to the user if you discover high-density tech debt or a cleaner design pattern during the feature refactor[cite: 2, 3].
4. **When in Doubt, Ask:** If you are unsure whether a piece of logic is dead or alive (especially due to decorator-driven wiring like NestJS DI or TypeORM metadata), do not guess—explicitly ask the user[cite: 1, 3].
5. **No Broken Windows:** Every step must include parallel test creation (Jest for backend services, Vitest + RTL for frontend components/hooks).
6. **Best practices:** Think first then generate a plan how to make it simple and reasonable according to engineering best practices.

---
