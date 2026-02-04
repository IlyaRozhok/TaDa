# Widgets Layer

This layer contains complex UI blocks that compose multiple features and entities.

## Structure

Each widget should follow this structure:
```
widgets/
├── property-list/
│   ├── index.ts       # Public API
│   ├── ui/           # Property list component
│   ├── model/        # List state, pagination
│   └── lib/          # List utilities
├── dashboard/
└── header/
```

## Rules

1. **Widgets can import from `shared`, `entities`, and `features`**
2. **Compose multiple features** - combine related functionality
3. **Page-level UI blocks** - substantial pieces of UI
4. **Reusable across pages** - not tied to specific routes

## Examples

- `property-list` - combines property cards, search, filters, pagination
- `user-dashboard` - combines user profile, preferences, shortlist
- `admin-panel` - combines user management, property management
- `navigation-header` - combines auth, language switching, navigation