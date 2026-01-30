# Localized Admin Forms Implementation

## Проблема

В админ формах создания/редактирования Building и Property используются хардкодед значения, которые не соответствуют локализованным значениям из preferences UI.

## Решение

### 1. Создан хук `useLocalizedFormOptions`

Хук предоставляет локализованные опции, которые соответствуют значениям из preferences:

```typescript
import { useLocalizedFormOptions } from '../shared/hooks/useLocalizedFormOptions';

function AddPropertyModal() {
  const {
    propertyTypeOptions,
    furnishingOptions,
    outdoorSpaceOptions,
    bedroomsOptions,
    bathroomsOptions,
  } = useLocalizedFormOptions();

  // Использование в форме
  return (
    <select>
      {propertyTypeOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
```

### 2. Маппинги значений

Созданы маппинги между UI значениями (локализованными) и API значениями:

#### Property Types

```typescript
// UI (локализованные) -> API
"Apartment" -> "apartment"  // property.type.name1
"Flat" -> "flat"           // property.type.name2
"Studio" -> "studio"       // property.type.name3
"Penthouse" -> "penthouse" // property.type.name4
"Room" -> "room"           // property.type.name5/6
```

#### Furnishing

```typescript
// UI (локализованные) -> API
"Furnished" -> "furnished"         // furnishing.count.name1
"Unfurnished" -> "unfurnished"     // furnishing.count.name2
"Part-furnished" -> "part_furnished" // furnishing.count.name3
```

#### Outdoor Space

```typescript
// UI (локализованные) -> API
"Balcony" -> "balcony"             // outdoorspace.name1
"Terrace" -> "terrace"             // outdoorspace.name2
"Outdoor Space" -> "outdoor_space"
```

#### Bedrooms/Bathrooms

```typescript
// UI (локализованные) -> API
"1" -> 1                           // rooms.count.name1
"2" -> 2                           // rooms.count.name2
"3" -> 3                           // rooms.count.name3
"4" -> 4                           // rooms.count.name4
"5+" -> 5                          // rooms.count.name5
```

### 3. Обновленные трансформации в preferences

Preferences теперь правильно трансформируют локализованные значения в API формат:

```typescript
// В transformFormDataForApi()
if (formData.property_type_preferences !== undefined) {
  apiData.property_types = transformPropertyTypeUIToAPI(
    formData.property_type_preferences,
  );
}

if (formData.furnishing_preferences !== undefined) {
  apiData.furnishing = transformFurnishingUIToAPI(
    formData.furnishing_preferences,
  );
}

if (formData.outdoor_space_preferences !== undefined) {
  const outdoorSpaceData = transformOutdoorSpaceUIToAPI(
    formData.outdoor_space_preferences,
  );
  if (outdoorSpaceData.outdoor_space)
    apiData.outdoor_space = outdoorSpaceData.outdoor_space;
  if (outdoorSpaceData.balcony) apiData.balcony = outdoorSpaceData.balcony;
  if (outdoorSpaceData.terrace) apiData.terrace = outdoorSpaceData.terrace;
}
```

## Пример обновления админ формы

### До (хардкодед значения):

```typescript
// ❌ Плохо - хардкодед значения
const propertyTypes = [
  { value: "flat", label: "Flat" },
  { value: "apartment", label: "Apartment" },
  { value: "studio", label: "Studio" },
  // ...
];
```

### После (локализованные значения):

```typescript
// ✅ Хорошо - локализованные значения
import { useLocalizedFormOptions } from '../shared/hooks/useLocalizedFormOptions';

function PropertyForm() {
  const { propertyTypeOptions } = useLocalizedFormOptions();

  return (
    <select>
      {propertyTypeOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label} {/* Автоматически локализовано */}
        </option>
      ))}
    </select>
  );
}
```

## Файлы для обновления

### Building Forms:

- `AddBuildingModal.tsx` - использовать `buildingUnitTypeOptions`, `tenantTypeOptions`
- `EditBuildingModal.tsx` - использовать `buildingUnitTypeOptions`, `tenantTypeOptions`

### Property Forms:

- `AddPropertyModal.tsx` - использовать все опции
- `EditPropertyModal.tsx` - использовать все опции

### Пример замены в AddPropertyModal:

```typescript
// Заменить хардкодед массив
const availablePropertyTypes = [
  "flat",
  "apartment",
  "house",
  "room",
  "studio",
  "penthouse",
];

// На локализованные опции
const { propertyTypeOptions } = useLocalizedFormOptions();
```

## Преимущества

1. **Консистентность**: Одинаковые значения в preferences и админ формах
2. **Локализация**: Автоматическая поддержка переводов
3. **Обслуживаемость**: Централизованное управление опциями
4. **Обратная совместимость**: API значения остаются неизменными

## Тестирование

1. Проверить, что админ формы отображают локализованные значения
2. Убедиться, что созданные/отредактированные properties/buildings корректно сохраняются
3. Проверить, что preferences matching работает корректно
4. Протестировать смену языка (если поддерживается)

## Следующие шаги

1. Обновить компоненты админ форм для использования `useLocalizedFormOptions`
2. Удалить хардкодед массивы значений
3. Протестировать интеграцию
4. Обновить документацию для разработчиков
