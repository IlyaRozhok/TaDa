# Features Layer

This layer contains user-facing features - specific business use cases and interactions.

## Structure

Each feature should follow this structure:
```
features/
├── auth/
│   ├── login/
│   │   ├── index.ts       # Public API
│   │   ├── ui/           # Login form, login button
│   │   ├── model/        # Login state, validation
│   │   └── lib/          # Login utilities
│   └── register/
├── property-search/
└── shortlist/
```

## Rules

1. **Features can import from `shared` and `entities`**
2. **One feature = one user action** (login, search, add to shortlist)
3. **Self-contained** - everything needed for the feature
4. **No cross-feature dependencies** - use composition in higher layers

## Examples

- `auth/login` - login form, login logic, login validation
- `property-search` - search filters, search results, search state
- `shortlist/add-property` - add to shortlist button, add logic
- `preferences/update` - preferences form, update logic