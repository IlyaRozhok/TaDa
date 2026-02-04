# Entities Layer

This layer contains business entities - the core domain models of the application.

## Structure

Each entity should follow this structure:
```
entities/
├── user/
│   ├── index.ts       # Public API
│   ├── ui/           # User-related UI components
│   ├── model/        # User types, state, business logic
│   └── lib/          # User-related utilities
├── property/
└── building/
```

## Rules

1. **Entities can only import from `shared`**
2. **No business logic** - only data structures and basic operations
3. **UI components should be generic** - no specific business use cases
4. **Export only what's needed** - keep internal implementation private

## Examples

- `User` entity: types, profile components, user utilities
- `Property` entity: property card, property types, property helpers
- `Building` entity: building info, building types, building utilities