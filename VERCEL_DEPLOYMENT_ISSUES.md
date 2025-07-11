# Рекомендации по исправлению проблем перед деплоем на Vercel

## ⚠️ Найденные проблемы и их решения

### 1. Использование localStorage без SSR проверок

**Проблема:** В некоторых файлах localStorage используется без проверки `typeof window !== 'undefined'`

**Файлы с проблемами:**

- `frontend/src/app/app/properties/manage/page.tsx` (строки 98, 123, 162)
- `frontend/src/app/components/providers/SessionManager.tsx` (строки 54, 55)

**Рекомендуемые исправления:**

```typescript
// Плохо:
const token = localStorage.getItem("accessToken");

// Хорошо:
const token =
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
```

### 2. Прямые fetch вместо axios

**Проблема:** В некоторых местах используется прямой fetch вместо настроенного axios instance

**Файлы:**

- `frontend/src/app/app/properties/manage/page.tsx`
- `frontend/src/app/app/properties/create/page.tsx`
- `frontend/src/app/components/MediaUpload.tsx`

**Рекомендация:** Использовать `propertiesAPI` из `lib/api.ts` вместо прямого fetch

### 3. Console.log в production

**Проблема:** Много отладочных сообщений в production коде

**Рекомендация:** Добавить условие для отображения логов только в development:

```typescript
// Вместо:
console.log("🚀 Making request:", config.method?.toUpperCase(), config.url);

// Использовать:
if (process.env.NODE_ENV === "development") {
  console.log("🚀 Making request:", config.method?.toUpperCase(), config.url);
}
```

### 4. Жесткие перезагрузки страницы

**Проблема:** Использование `window.location.reload()` в нескольких местах

**Файлы:**

- `frontend/src/app/app/dashboard/tenant/page.tsx`
- `frontend/src/app/app/matches/page.tsx`
- `frontend/src/app/app/properties/page.tsx`

**Рекомендация:** Использовать `router.refresh()` из Next.js navigation

```typescript
// Вместо:
window.location.reload();

// Использовать:
import { useRouter } from "next/navigation";
const router = useRouter();
router.refresh();
```

## ✅ Что уже исправлено

1. **localStorage в language-context.tsx** - уже правильно обернут в `typeof window !== 'undefined'`
2. **localStorage в CookieModal.tsx** - исправлен для SSR совместимости
3. **next.config.ts** - уже оптимизирован для Vercel
4. **vercel.json** - правильно настроен

## 🚀 Готовность к деплою

**Текущий статус:** 90% готов к деплою

Приложение можно деплоить на Vercel прямо сейчас, но рекомендуется исправить указанные проблемы для лучшей производительности и стабильности.

## 📋 Чек-лист перед деплоем

- [x] Конфигурация Next.js готова
- [x] Vercel.json настроен
- [x] Переменные окружения определены
- [x] localStorage обработан в критичных местах
- [ ] Исправить прямые fetch на axios
- [ ] Убрать console.log из production
- [ ] Заменить window.location.reload на router.refresh
- [ ] Добавить error boundaries для продакшена

## 🔧 Быстрые исправления

Минимальные изменения для деплоя:

1. **Добавить в .env.local:**

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

2. **Установить переменную в Vercel:**

- Перейти в Settings → Environment Variables
- Добавить `NEXT_PUBLIC_API_URL` со значением вашего бэкенда

3. **Деплой готов!**
