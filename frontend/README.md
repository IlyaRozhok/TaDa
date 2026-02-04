# TaDa Frontend Application

Modern, scalable frontend application built with Next.js, TypeScript, and Feature-Sliced Design architecture.

## 🏗️ Architecture

This application follows **Feature-Sliced Design (FSD)** methodology for better maintainability and scalability.

### Project Structure

```
src/
├── app/                    # Next.js App Router (routing only)
├── processes/              # Cross-page business processes
├── pages/                  # Page-level components (composition)
├── widgets/                # Complex UI blocks
├── features/               # User interactions & business features
├── entities/               # Business entities (User, Property, etc.)
└── shared/                 # Reusable utilities, UI, types
    ├── api/               # Centralized API management
    ├── lib/               # Utilities and helpers
    ├── types/             # TypeScript type definitions
    └── ui/                # Design system components
```

### Layer Rules

- **shared** → No dependencies on other layers
- **entities** → Can import from `shared`
- **features** → Can import from `shared`, `entities`
- **widgets** → Can import from `shared`, `entities`, `features`
- **processes** → Can import from all lower layers
- **pages** → Can import from all lower layers
- **app** → Can import from all layers

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development Scripts

```bash
npm run dev              # Start development server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Check TypeScript types
npm run quality          # Run type-check + lint
npm run quality:fix      # Run type-check + lint:fix
```

## 🎨 Design System

The application uses a centralized design system with:

- **Design Tokens**: Colors, spacing, typography
- **Component Library**: Reusable UI components
- **Consistent Styling**: Tailwind CSS with custom tokens

### Using Design Tokens

```typescript
import { colors, spacing, textStyles } from '@/shared/ui/tokens';

// Use in components
const buttonStyle = {
  backgroundColor: colors.primary[500],
  padding: spacing[4],
  ...textStyles.button,
};
```

## 🔧 API Management

Centralized API layer with:

- **Type-safe endpoints**: Full TypeScript coverage
- **Error handling**: Consistent error responses
- **Authentication**: Automatic token management
- **Caching**: React Query integration

### Using API

```typescript
import { api } from '@/shared/api';
import { useLogin } from '@/shared/api/hooks';

// Direct API calls
const user = await api.auth.login({ email, password });

// React Query hooks
const loginMutation = useLogin();
```

## 📱 Performance

The application is optimized for performance with:

- **Lazy Loading**: Route-based code splitting
- **Virtual Scrolling**: For large lists
- **Memoization**: Smart component optimization
- **Image Optimization**: Next.js Image component

### Performance Utilities

```typescript
import { 
  createLazyComponent, 
  useVirtualScroll,
  useMemoizedCallback 
} from '@/shared/lib/performance';

// Lazy load components
const LazyModal = createLazyComponent(
  () => import('./Modal'),
  'Modal'
);

// Virtual scrolling for large lists
const { virtualItems } = useVirtualScroll(items, {
  itemHeight: 100,
  containerHeight: 500,
});
```

## 🧪 Testing

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage
```

### Testing Guidelines

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test feature workflows
- **E2E Tests**: Test complete user journeys

## 📋 Code Standards

### TypeScript

- **Strict mode enabled**: No `any` types allowed
- **Explicit return types**: For all functions
- **Proper naming**: PascalCase for types, camelCase for variables

### React

- **Function components**: Preferred over class components
- **Hooks**: Use custom hooks for reusable logic
- **Props interfaces**: Always define prop types

### Import Organization

```typescript
// External libraries
import React from 'react';
import { NextPage } from 'next';

// Internal imports (ordered by FSD layers)
import { User } from '@/shared/types';
import { Button } from '@/shared/ui';
import { UserCard } from '@/entities/user';
import { LoginForm } from '@/features/auth';
```

## 🔍 Development Guidelines

### Adding New Features

1. **Identify the layer**: Determine if it's an entity, feature, or widget
2. **Create the structure**: Follow the slice structure (ui/, model/, lib/)
3. **Export properly**: Use index.ts files for public APIs
4. **Add types**: Define TypeScript interfaces
5. **Write tests**: Add unit tests for new functionality

### Component Creation

```typescript
// entities/user/ui/UserCard.tsx
import React from 'react';
import { User } from '@/shared/types';

interface UserCardProps {
  user: User;
  onClick?: (user: User) => void;
}

export function UserCard({ user, onClick }: UserCardProps): JSX.Element {
  return (
    <div onClick={() => onClick?.(user)}>
      {user.full_name}
    </div>
  );
}
```

### API Integration

```typescript
// shared/api/endpoints/users.ts
import { apiClient } from '../client';
import { User, CreateUserRequest } from '@/shared/types';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },
  
  create: async (userData: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', userData);
    return response.data;
  },
} as const;
```

## 🚨 Common Issues

### Import Errors

- Use absolute imports with `@/` prefix
- Follow FSD layer import rules
- Check if the module exports what you're importing

### Type Errors

- Enable strict TypeScript mode
- Define proper interfaces for all props
- Use shared types from `@/shared/types`

### Performance Issues

- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load heavy components

## 📚 Additional Resources

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query Documentation](https://tanstack.com/query/latest)

## 🤝 Contributing

1. Follow the established architecture patterns
2. Write tests for new features
3. Update documentation when needed
4. Follow the code style guidelines
5. Create meaningful commit messages

## 📄 License

This project is private and proprietary.