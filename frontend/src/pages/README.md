# Pages Layer

This layer contains page-level components that compose widgets and processes for specific routes.

## Structure

Each page should follow this structure:
```
pages/
├── home/
│   ├── index.ts       # Public API
│   ├── ui/           # Home page component
│   └── model/        # Page-specific state (if any)
├── property-details/
└── dashboard/
```

## Rules

1. **Pages can import from all lower layers**
2. **Minimal logic** - mostly composition of widgets/processes
3. **Route-specific** - tied to specific URL paths
4. **Layout composition** - arrange widgets on the page
5. **SEO and meta** - handle page titles, descriptions

## Examples

- `home` - hero section + featured properties + search widget
- `property-details` - property info + booking widget + similar properties
- `dashboard` - navigation + dashboard widget + user info
- `search-results` - search filters + property list + map widget

## Next.js Integration

These pages are consumed by Next.js app router:
```
app/
├── page.tsx           # → pages/home
├── properties/
│   └── [id]/
│       └── page.tsx   # → pages/property-details
└── dashboard/
    └── page.tsx       # → pages/dashboard
```