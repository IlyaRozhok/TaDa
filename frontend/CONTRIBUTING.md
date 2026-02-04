# Contributing to TaDa Frontend

Thank you for contributing to the TaDa frontend application! This guide will help you understand our development workflow and standards.

## 🏗️ Architecture Principles

### Feature-Sliced Design (FSD)

We follow FSD methodology strictly. Before contributing:

1. **Understand the layers**: shared → entities → features → widgets → processes → pages → app
2. **Follow import rules**: Lower layers cannot import from higher layers
3. **Use proper slice structure**: Each slice should have ui/, model/, lib/, and index.ts

### Code Organization

```
feature/
├── index.ts              # Public API (required)
├── ui/                   # React components
│   ├── Component.tsx
│   └── index.ts
├── model/                # Business logic, state, types
│   ├── types.ts
│   ├── store.ts
│   └── index.ts
└── lib/                  # Utilities and helpers
    ├── utils.ts
    └── index.ts
```

## 🔧 Development Workflow

### 1. Setting Up

```bash
# Clone and install
git clone <repository>
cd frontend
npm install

# Start development
npm run dev
```

### 2. Before You Start

- Check existing issues and PRs
- Discuss major changes in issues first
- Ensure you understand the feature requirements

### 3. Development Process

1. **Create a branch**: `git checkout -b feature/your-feature-name`
2. **Follow conventions**: Use our coding standards
3. **Write tests**: Add tests for new functionality
4. **Check quality**: Run `npm run quality` before committing
5. **Commit properly**: Follow conventional commits

## 📝 Coding Standards

### TypeScript

```typescript
// ✅ Good
interface UserCardProps {
  user: User;
  onClick?: (user: User) => void;
}

export function UserCard({ user, onClick }: UserCardProps): JSX.Element {
  const handleClick = useCallback(() => {
    onClick?.(user);
  }, [user, onClick]);

  return <div onClick={handleClick}>{user.full_name}</div>;
}

// ❌ Bad
export function UserCard({ user, onClick }: any) {
  return <div onClick={() => onClick(user)}>{user.full_name}</div>;
}
```

### React Components

#### Function Components
- Use function declarations, not arrow functions for named components
- Always define prop interfaces
- Use proper TypeScript return types

```typescript
// ✅ Good
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps): JSX.Element {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ❌ Bad
export const Button = ({ children, variant, onClick }: any) => (
  <button className={`btn btn-${variant || 'primary'}`} onClick={onClick}>
    {children}
  </button>
);
```

#### Hooks
- Use custom hooks for reusable logic
- Prefix with 'use'
- Return objects for multiple values

```typescript
// ✅ Good
export function useUserProfile(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // fetch logic
  }, [userId]);

  return { user, loading, error };
}

// ❌ Bad
export function useUserProfile(userId: string) {
  const [user, setUser] = useState<any>(null);
  // ... logic
  return [user, loading, error]; // Array return is less clear
}
```

### Import Organization

Follow this order:

```typescript
// 1. External libraries
import React, { useState, useCallback } from 'react';
import { NextPage } from 'next';
import { useQuery } from '@tanstack/react-query';

// 2. Shared layer
import { User, Property } from '@/shared/types';
import { Button, Modal } from '@/shared/ui';
import { api } from '@/shared/api';

// 3. Entities layer
import { UserCard } from '@/entities/user';
import { PropertyCard } from '@/entities/property';

// 4. Features layer
import { LoginForm } from '@/features/auth';
import { SearchFilters } from '@/features/property-search';

// 5. Widgets layer
import { UserDashboard } from '@/widgets/dashboard';

// 6. Current layer imports
import { ComponentA } from './ComponentA';
import { utils } from './utils';
```

### Naming Conventions

- **Components**: PascalCase (`UserCard`, `PropertyList`)
- **Hooks**: camelCase with 'use' prefix (`useUserProfile`, `usePropertySearch`)
- **Types/Interfaces**: PascalCase (`User`, `PropertyFilters`)
- **Variables/Functions**: camelCase (`userName`, `handleClick`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `DEFAULT_PAGE_SIZE`)
- **Files**: kebab-case for utilities, PascalCase for components

## 🧪 Testing Guidelines

### Unit Tests

Test individual components and functions:

```typescript
// UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

const mockUser = {
  id: '1',
  full_name: 'John Doe',
  email: 'john@example.com',
};

describe('UserCard', () => {
  it('renders user name', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<UserCard user={mockUser} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('John Doe'));
    expect(handleClick).toHaveBeenCalledWith(mockUser);
  });
});
```

### Integration Tests

Test feature workflows:

```typescript
// LoginFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginFlow } from './LoginFlow';

describe('LoginFlow', () => {
  it('logs in user successfully', async () => {
    render(<LoginFlow />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });
});
```

## 🎨 Design System Usage

### Using Design Tokens

```typescript
import { colors, spacing, textStyles } from '@/shared/ui/tokens';

// ✅ Good - Use design tokens
const styles = {
  backgroundColor: colors.primary[500],
  padding: spacing[4],
  ...textStyles.body,
};

// ❌ Bad - Hardcoded values
const styles = {
  backgroundColor: '#3b82f6',
  padding: '16px',
  fontSize: '16px',
};
```

### Creating New Components

1. **Check existing components** first
2. **Use design tokens** for styling
3. **Follow component API patterns**
4. **Add to Storybook** if it's a shared component

```typescript
// shared/ui/NewComponent/NewComponent.tsx
import React from 'react';
import { colors, spacing } from '../tokens';

interface NewComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlighted';
}

export function NewComponent({ 
  children, 
  variant = 'default' 
}: NewComponentProps): JSX.Element {
  const backgroundColor = variant === 'highlighted' 
    ? colors.primary[50] 
    : colors.neutral[50];

  return (
    <div 
      style={{ 
        backgroundColor, 
        padding: spacing[4] 
      }}
    >
      {children}
    </div>
  );
}
```

## 🔄 API Integration

### Adding New Endpoints

1. **Define types** in `shared/types/`
2. **Create endpoint** in `shared/api/endpoints/`
3. **Add to main API object**
4. **Create React Query hooks** if needed

```typescript
// shared/api/endpoints/new-feature.ts
import { apiClient } from '../client';
import { NewFeatureData } from '@/shared/types';

export const newFeatureApi = {
  getAll: async (): Promise<NewFeatureData[]> => {
    const response = await apiClient.get<NewFeatureData[]>('/new-feature');
    return response.data;
  },
  
  create: async (data: CreateNewFeatureRequest): Promise<NewFeatureData> => {
    const response = await apiClient.post<NewFeatureData>('/new-feature', data);
    return response.data;
  },
} as const;
```

## 🚀 Performance Guidelines

### Component Optimization

```typescript
// ✅ Good - Memoized component
import { memo } from 'react';
import { shallowEqual } from '@/shared/lib/performance';

interface ExpensiveComponentProps {
  data: ComplexData[];
  onItemClick: (item: ComplexData) => void;
}

export const ExpensiveComponent = memo<ExpensiveComponentProps>(
  ({ data, onItemClick }) => {
    return (
      <div>
        {data.map(item => (
          <ExpensiveItem 
            key={item.id} 
            item={item} 
            onClick={onItemClick} 
          />
        ))}
      </div>
    );
  },
  shallowEqual
);
```

### Virtual Scrolling for Large Lists

```typescript
import { useVirtualScroll } from '@/shared/lib/optimization';

export function LargeList({ items }: { items: Item[] }) {
  const { virtualItems, scrollElementProps, viewportProps } = useVirtualScroll(
    items,
    {
      itemHeight: 100,
      containerHeight: 500,
    }
  );

  return (
    <div {...scrollElementProps}>
      <div {...viewportProps}>
        {virtualItems.map(({ index, item, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetTop,
              height: 100,
            }}
          >
            <ItemComponent item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm run test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] Documentation updated if needed

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass
- [ ] Documentation updated
```

## 🐛 Debugging

### Common Issues

1. **Import errors**: Check FSD layer rules
2. **Type errors**: Enable strict mode, define proper types
3. **Performance issues**: Use React DevTools Profiler
4. **API errors**: Check network tab, API client logs

### Debugging Tools

- React DevTools
- Redux DevTools
- Network tab in browser
- TypeScript compiler errors
- ESLint warnings

## 📚 Resources

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query](https://tanstack.com/query/latest)

## 💬 Getting Help

- Create an issue for bugs or feature requests
- Ask questions in team chat
- Review existing documentation
- Check similar implementations in the codebase

Thank you for contributing! 🙏