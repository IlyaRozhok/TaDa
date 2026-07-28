# docs/archive — исторические документы

Здесь лежат `.md`, которые описывают несуществующее или уже выполненное состояние проекта.
Они сохранены как след принятых решений и **не являются руководством к действию**.
Актуальный источник истины — [`docs/audit/`](../audit/).

| Файл | Откуда перенесён | Почему в архиве |
|---|---|---|
| `frontend-README.md` | `frontend/README.md` | Описывает FSD-архитектуру, которая отменена; 14 расхождений с кодом (см. `04-docs-diff.md`) |
| `frontend-src-pages-README.md` | `frontend/src/pages/README.md` | Описывает FSD-слой `pages`, который никогда не был реализован |
| `2026-03-28-auth-refactor-plan.md` | `docs/superpowers/plans/` | Выполнен частично; ссылается на Redis-сессии, которых больше нет |
| `2026-03-28-auth-refactor-design.md` | `docs/superpowers/specs/` | То же |
| `2026-04-11-frontend-refactoring-plan.md` | `docs/superpowers/plans/` | Брошен на этапе каркаса; породил осиротевший `src/components/` |
| `2026-04-11-frontend-refactoring-design.md` | `docs/superpowers/specs/` | То же |
| `2026-04-01-property-amenities-plan.md` | `frontend/docs/superpowers/plans/` | Фича реализована; план предписывал класть миграцию в устаревшую папку `backend/database/` |
| `2026-04-01-property-amenities-design.md` | `frontend/docs/superpowers/specs/` | То же |
| `ONBOARDING_PHONE_UPDATE.md` | `frontend/src/app/components/onboarding/` | Changelog-фрагмент про `OnboardingProfileStep.tsx` — мёртвый компонент |
| `ONBOARDING_SAVE_BUTTON_UPDATE.md` | `frontend/src/app/components/onboarding/` | То же |

Перенесено через `git mv` — история файлов сохранена.
Часть из них штатно удаляется в Фазе 2 плана рефакторинга; тогда их можно убрать и отсюда.
