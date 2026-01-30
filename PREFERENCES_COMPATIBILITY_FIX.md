# Preferences Compatibility Fix

## Проблема

После установки локализации для preferences были выявлены критические несоответствия между значениями в preferences UI, админ формами создания/редактирования building/properties и backend matching логикой.

## Выявленные несоответствия

### 1. Building Types

- **Preferences UI**: `["BTR", "Co-living", "Professional Management", "Private Landlord"]`
- **Админ формы**: `["btr", "co_living", "professional_management", "private_landlord"]` (snake_case)
- **Backend matching**: Ожидает snake_case значения

### 2. Tenant Types

- **Preferences UI**: `["Professional", "Student", "Corporate tenant", "Family", "Sharers / Friends", "Other"]`
- **Админ формы**: `["corporateLets", "sharers", "student", "family", "elder"]` (camelCase + разные значения)

### 3. Duration Values

- **Preferences UI**: `["Short term (1–6 months)", "Medium term (6–12 months)", "Long term (12+ months)", "Flexible"]`
- **Админ формы**: `["any", "long_term", "short_term", "flexible"]` (snake_case)

### 4. Bills Values

- **Preferences UI**: `["Include", "Exclude"]`
- **Админ формы**: `["included", "excluded"]` (lowercase)

### 5. Amenities

- **Preferences**: Используют различные категории (lifestyle, social, work, convenience, pet, luxury)
- **Админ формы**: Hardcoded список из 15 amenities
- **Несоответствие**: Разные наборы amenities

## Решение

### Созданы новые файлы:

1. **`/frontend/src/shared/constants/mappings.ts`** - Основные маппинги и трансформации
2. **`/frontend/src/shared/constants/admin-form-options.ts`** - Общие константы для админ форм
3. **`/frontend/src/shared/constants/__tests__/mappings.test.ts`** - Тесты для трансформаций
4. **`/frontend/src/shared/constants/transformation-example.ts`** - Пример использования

### Обновленные файлы:

1. **`/frontend/src/entities/preferences/model/preferences.ts`** - Добавлены правильные трансформации
2. **`/frontend/src/app/components/tenant-cv/TenantCvView.tsx`** - Использует новые трансформации

## Ключевые трансформации

### Building Types

```typescript
// UI -> API
"BTR" -> "btr"
"Co-living" -> "co_living"
"Professional Management" -> "professional_management"
"Private Landlord" -> "private_landlord"
```

### Tenant Types

```typescript
// UI -> API
"Professional" -> "corporateLets"
"Corporate tenant" -> "corporateLets"
"Student" -> "student"
"Family" -> "family"
"Sharers / Friends" -> "sharers"
"Other" -> "family" // fallback
```

### Duration

```typescript
// UI -> API
"Short term (1–6 months)" -> "short_term"
"Medium term (6–12 months)" -> "long_term"
"Long term (12+ months)" -> "long_term"
"Flexible" -> "flexible"
```

### Bills

```typescript
// UI -> API
"Include" -> "included"
"Exclude" -> "excluded"
```

### Amenities

Preferences amenities (lifestyle, social, work, etc.) теперь корректно маппятся в admin amenities для обеспечения совместимости с matching логикой.

## Функции трансформации

Все трансформации доступны через функции в `mappings.ts`:

```typescript
import {
  transformBuildingTypeUIToAPI,
  transformBuildingTypeAPIToUI,
  transformTenantTypeUIToAPI,
  transformTenantTypeAPIToUI,
  transformDurationUIToAPI,
  transformDurationAPIToUI,
  transformBillsUIToAPI,
  transformBillsAPIToUI,
  transformPreferencesAmenitiesToAdmin,
  transformAdminAmenitiesToPreferences,
} from "../shared/constants/mappings";
```

## Обратная совместимость

- ✅ Существующие preferences в БД будут корректно отображаться в UI
- ✅ Новые preferences будут корректно сохраняться в API формате
- ✅ Backend matching будет работать с правильными значениями
- ✅ Админ формы продолжат работать без изменений

## Тестирование

Запустите тесты для проверки трансформаций:

```bash
npm test -- mappings.test.ts
```

## Рекомендации для дальнейшего развития

### 1. Использование общих констант

Вместо hardcoded значений в компонентах используйте константы из `admin-form-options.ts`:

```typescript
// ❌ Плохо
const availableAmenities = ["Gym", "Co-working", ...];

// ✅ Хорошо
import { AMENITIES_OPTIONS } from '../shared/constants/admin-form-options';
const availableAmenities = AMENITIES_OPTIONS;
```

### 2. Консистентность значений

При добавлении новых опций обновляйте маппинги в `mappings.ts` для обеспечения совместимости.

### 3. Тестирование трансформаций

При изменении маппингов обязательно обновляйте тесты в `mappings.test.ts`.

### 4. Документация изменений

При изменении логики трансформаций обновляйте этот документ.

## Проверка работоспособности

1. **Preferences UI**: Проверьте, что формы preferences корректно отображают существующие данные
2. **Админ формы**: Убедитесь, что создание/редактирование building/property работает без изменений
3. **Matching**: Проверьте, что matching логика корректно сопоставляет preferences с properties
4. **TenantCV**: Убедитесь, что отображение preferences в TenantCV корректно

## Потенциальные проблемы

### 1. Миграция данных

Если в БД есть preferences с некорректными значениями, они могут не отображаться в UI. Рекомендуется провести аудит данных.

### 2. Кэширование

Если используется кэширование preferences, очистите кэш после деплоя изменений.

### 3. API версионирование

При изменении API контрактов убедитесь в обратной совместимости или используйте версионирование API.

## Заключение

Данные изменения обеспечивают полную совместимость между preferences UI, админ формами и backend matching логикой, сохраняя при этом обратную совместимость с существующими данными.
