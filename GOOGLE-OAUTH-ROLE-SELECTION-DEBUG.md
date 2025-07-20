# Google OAuth Role Selection Debug Guide

## 🔍 Проблема

Новым пользователям через Google OAuth не показывается выбор роли.

## 🛠️ Шаги для диагностики

### Шаг 1: Проверить базу данных

```bash
cd backend
npx ts-node scripts/check-role-nullable.ts
```

**Ожидаемый результат:**

```
✅ Role column is nullable - migration was successful!
✅ Role column has no default value
✅ Successfully created user with null role
```

**Если видите ошибки:**

```bash
# Применить миграцию
npm run typeorm:migration:run
# или
npx typeorm migration:run -d src/database/data-source.ts
```

### Шаг 2: Протестировать Google OAuth в backend

```bash
cd backend
npx ts-node scripts/test-google-oauth-new-user.ts
```

**Ожидаемый результат:**

```
✅ GoogleAuth successful: { userRole: null, isNewUser: true }
✅ Token generated
✅ Role set to tenant
🎉 All tests passed!
```

### Шаг 3: Протестировать в браузере

1. **Откройте DevTools (F12) → Console**
2. **Очистите localStorage:**
   ```javascript
   localStorage.clear();
   ```
3. **Перейдите на:** `http://localhost:5001/auth/google`
4. **Войдите через Google с НОВЫМ email (которого нет в базе)**
5. **Следите за логами в Console**

**Ожидаемые логи:**

```
🔍 OAuth callback parameters: { isNewUser: true }
🔍 Profile response: { userRole: null }
🔍 Deciding redirect: { hasRole: false }
✅ User has no role - redirecting to role selection
🔍 Home page - checking needsRole parameter: { needsRole: "true" }
✅ Home page - needs role selection, opening AuthModal
🔍 AuthModal - checking forceRoleSelection: { forceRoleSelection: true, isOAuthRoleSelection: true }
✅ AuthModal - forcing role selection step
```

## 🚨 Возможные проблемы и решения

### 1. Role column не nullable

**Симптом:** `❌ Role column is NOT nullable`
**Решение:**

```bash
cd backend
# Применить миграцию
npm run typeorm:migration:run
```

### 2. Frontend не показывает выбор роли

**Симптом:** В логах нет `needsRole: "true"`
**Проблема:** Backend не создает пользователя с `role: null`
**Проверьте:** Backend логи должны показывать:

```
✅ Created new user from Google OAuth (no role yet)
✅ GoogleAuth successful: { userRole: null, isNewUser: true }
```

### 3. AuthModal не открывается

**Симптом:** В логах есть `needsRole: "true"`, но модал не открывается
**Решение:** Проверьте, что:

```
✅ Home page - needs role selection, opening AuthModal
🔍 AuthModal - checking forceRoleSelection: { forceRoleSelection: true }
```

### 4. Modal открывается, но показывает login форму вместо выбора роли

**Симптом:** Открывается форма с email/password
**Проблема:** `isOAuthRoleSelection` не передается правильно
**Проверьте:** В `page.tsx` должно быть:

```javascript
<AuthModal
  isOpen={authModalOpen}
  onClose={...}
  forceRoleSelection={needsRoleSelection}
  isOAuthRoleSelection={needsRoleSelection}
/>
```

### 5. setRole API не вызывается

**Симптом:** При выборе роли ничего не происходит
**Проверьте логи:**

```
🔍 AuthModal - handling role submit: { isOAuthRoleSelection: true }
✅ AuthModal - calling setRole API for OAuth user
```

## 🧪 Полный тест потока

1. **Очистите данные:**

   ```bash
   # Удалите тестового пользователя из базы (если есть)
   ```

2. **Запустите backend:**

   ```bash
   cd backend
   npm run start:dev
   ```

3. **Запустите frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

4. **Протестируйте с новым Google аккаунтом**

## 📋 Контрольный список

- [ ] Миграция применена (`role` nullable)
- [ ] Backend создает пользователей с `role: null`
- [ ] Backend возвращает `isNewUser: true`
- [ ] Frontend перенаправляет на `/?needsRole=true`
- [ ] AuthModal открывается с выбором роли
- [ ] При выборе роли вызывается `setRole` API
- [ ] После выбора роли создается профиль и preferences
- [ ] Пользователь перенаправляется на dashboard

## 🔧 Быстрое исправление

Если проблема остается, выполните:

```bash
# 1. Применить миграцию
cd backend
npm run typeorm:migration:run

# 2. Очистить базу от тестовых пользователей
# Удалите пользователей с role = null или без профилей

# 3. Перезапустить backend
npm run start:dev

# 4. Протестировать с новым Google email
```
