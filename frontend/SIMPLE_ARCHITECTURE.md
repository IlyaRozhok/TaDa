# Упрощенная архитектура для Next.js App Router

## 🎯 Философия

**Простота превыше всего!** Используем естественную структуру Next.js App Router вместо сложных архитектурных паттернов.

## 📁 Рекомендуемая структура

```
src/
├── app/                    # Next.js App Router (основа)
│   ├── (auth)/            # Route groups
│   ├── dashboard/         # Nested routes
│   ├── properties/        # Feature routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
│
├── components/            # Переиспользуемые UI компоненты
│   ├── ui/               # Базовые UI элементы
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── forms/            # Формы
│   └── layout/           # Layout компоненты
│
├── lib/                  # Утилиты и конфигурация
│   ├── api.ts           # API клиент
│   ├── auth.ts          # Аутентификация
│   ├── utils.ts         # Общие утилиты
│   └── validations.ts   # Схемы валидации
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useLocalStorage.ts
│
├── types/               # TypeScript типы
│   ├── auth.ts
│   ├── property.ts
│   └── api.ts
│
├── store/               # State management (Redux/Zustand)
│   ├── slices/
│   └── store.ts
│
└── styles/              # Стили
    ├── globals.css
    └── components.css
```

## 🚀 Принципы

### 1. **Next.js First**
- Используем App Router как основу архитектуры
- Route groups для организации маршрутов
- Server Components где возможно
- Client Components только когда нужно

### 2. **Простая организация компонентов**
```typescript
// ✅ Хорошо - простая структура
components/
├── ui/Button.tsx           # Базовые UI элементы
├── forms/LoginForm.tsx     # Специфичные формы
└── layout/Header.tsx       # Layout компоненты

// ❌ Плохо - избыточная структура
entities/property/ui/PropertyCard/ui/PropertyCardContent/index.tsx
```

### 3. **Колокация (Co-location)**
Держите связанные файлы рядом:
```
app/dashboard/
├── page.tsx              # Страница
├── loading.tsx           # Loading UI
├── error.tsx             # Error UI
├── components/           # Компоненты только для dashboard
│   └── DashboardStats.tsx
└── lib/                  # Утилиты только для dashboard
    └── dashboard-utils.ts
```

### 4. **Простые импорты**
```typescript
// ✅ Простые алиасы
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { User } from '@/types/auth'

// ❌ Сложные FSD алиасы
import { Button } from '@/shared/ui/Button/Button'
import { PropertyEntity } from '@/entities/property/model/types'
```

## 🛠️ Инструменты и настройки

### TypeScript (упрощенный)
```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

### ESLint (упрощенный)
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "off"
  }
}
```

## 📋 Рефакторинг план

### Фаза 1: Упрощение конфигурации ✅
- [x] Упростить TypeScript правила
- [x] Упростить ESLint правила
- [x] Убрать избыточные алиасы

### Фаза 2: Реорганизация структуры
```bash
# Переместить компоненты из FSD в простую структуру
src/shared/ui/ → src/components/ui/
src/entities/property/ui/ → src/components/property/
src/features/auth/ → src/components/auth/ + src/lib/auth.ts
```

### Фаза 3: Упрощение компонентов
- Разбить большие компоненты на маленькие
- Использовать колокацию для связанных файлов
- Упростить импорты

## 💡 Практические рекомендации

### Для компонентов:
```typescript
// ✅ Простой компонент
export function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="card">
      <h3>{property.title}</h3>
      <p>{property.description}</p>
    </div>
  )
}

// ❌ Избыточно сложный компонент
export const PropertyCard: React.FC<PropertyCardProps> = memo(({ 
  property,
  onSelect,
  isSelected,
  variant = 'default',
  size = 'medium'
}) => {
  // 100+ строк кода
})
```

### Для API:
```typescript
// ✅ Простой API клиент
export const api = {
  properties: {
    getAll: () => fetch('/api/properties').then(r => r.json()),
    getById: (id: string) => fetch(`/api/properties/${id}`).then(r => r.json()),
    create: (data: CreatePropertyData) => 
      fetch('/api/properties', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }).then(r => r.json())
  }
}
```

### Для типов:
```typescript
// ✅ Простые типы
export interface Property {
  id: string
  title: string
  description?: string
  price: number
  images: string[]
}

// ❌ Избыточно сложные типы
export interface PropertyEntity extends BaseEntity {
  readonly id: PropertyId
  title: NonEmptyString
  description: Optional<LongText>
  price: PositiveNumber
  images: ReadonlyArray<ImageUrl>
}
```

## 🎯 Цель

Создать **простую, понятную и легко поддерживаемую** архитектуру, которая:
- Использует силу Next.js App Router
- Не перегружена абстракциями
- Легко понимается новыми разработчиками
- Быстро развивается и масштабируется

**Помните: Лучшая архитектура - та, которую понимает вся команда!**