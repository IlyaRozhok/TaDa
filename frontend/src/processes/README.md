# Processes Layer

This layer contains cross-page business processes and complex workflows.

## Structure

Each process should follow this structure:
```
processes/
├── onboarding/
│   ├── index.ts       # Public API
│   ├── ui/           # Onboarding wizard, steps
│   ├── model/        # Onboarding state, flow logic
│   └── lib/          # Onboarding utilities
├── property-booking/
└── tenant-application/
```

## Rules

1. **Processes can import from all lower layers**
2. **Multi-step workflows** - spanning multiple pages/modals
3. **Complex business logic** - orchestrating multiple features
4. **State management** - managing process state across steps

## Examples

- `onboarding` - user registration → profile setup → preferences → verification
- `property-booking` - property selection → application → payment → confirmation
- `tenant-application` - property interest → document upload → background check
- `operator-setup` - company registration → verification → property listing