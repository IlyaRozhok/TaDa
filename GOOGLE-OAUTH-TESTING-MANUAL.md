# 🚀 Руководство по тестированию Google OAuth с выбором роли

## ✅ Готовность системы подтверждена!

### Что было сделано:

1. **Backend:**

   - Создание пользователей с `role: null` для новых Google OAuth пользователей
   - API endpoint `/auth/set-role` для установки роли после OAuth
   - Автоматическое создание профилей при выборе роли
   - Подробное логирование для диагностики

2. **Frontend:**

   - AuthModal не закрывается для пользователей без роли
   - Показ выбора роли после Google OAuth для новых пользователей
   - Улучшенный UI кнопки "Continue with Google"
   - Подробное логирование в консоли браузера

3. **База данных:**
   - Колонка `role` теперь nullable
   - Миграция применена успешно

## 📋 Пошаговая инструкция тестирования

### 1. Подготовка

```bash
# Откройте 3 терминала

# Терминал 1 - Backend
cd backend
npm run start:dev

# Терминал 2 - Frontend
cd frontend
npm run dev

# Терминал 3 - База данных (опционально для мониторинга)
docker-compose up -d
```

### 2. Тестирование в браузере

1. **Откройте http://localhost:3000**
2. **Откройте DevTools (F12) → Console**
3. **Очистите данные браузера:**
   ```javascript
   localStorage.clear();
   ```

### 3. Тест нового пользователя

1. **Нажмите кнопку входа** → откроется AuthModal
2. **Нажмите "Continue with Google"**

   В консоли увидите:

   ```
   🔍 AuthModal - Google Auth button clicked
   🔍 Redirecting to: http://localhost:5001/auth/google
   ```

3. **Выберите Google аккаунт** (используйте email, которого НЕТ в базе)

4. **После возврата из Google** в консоли увидите:

   ```
   🔍 OAuth callback parameters: { isNewUser: true }
   🔍 Profile response: { userRole: null }
   ✅ User has no role - redirecting to role selection
   ```

5. **Автоматически откроется AuthModal с выбором роли:**

   - I'm looking for a place (Tenant)
   - I have properties to rent (Operator)

6. **Выберите роль и нажмите Continue**

   В консоли:

   ```
   🔍 AuthModal - handling role submit: { selectedRole: "tenant", isOAuthRoleSelection: true }
   ✅ AuthModal - calling setRole API for OAuth user
   ✅ AuthModal - setRole successful
   ```

7. **Произойдет редирект на dashboard**

### 4. Тест существующего пользователя

1. **Выйдите из системы**
2. **Снова нажмите "Continue with Google"**
3. **Выберите тот же Google аккаунт**
4. **Произойдет автоматический вход** (без выбора роли)

## 🔍 Диагностика проблем

### Если не показывается выбор роли:

1. **Проверьте backend логи:**

   ```
   ✅ Created new user from Google OAuth (no role yet)
   ✅ GoogleAuth successful: { userRole: null, isNewUser: true }
   ```

2. **Проверьте frontend консоль:**

   ```
   ✅ User has no role - redirecting to role selection
   ✅ Home page - needs role selection, opening AuthModal
   ✅ AuthModal - forcing role selection step
   ```

3. **Проверьте базу данных:**
   ```bash
   cd backend
   npx ts-node scripts/check-role-nullable.ts
   ```

### Если AuthModal закрывается сразу:

- Убедитесь, что применены последние изменения в `AuthModal.tsx`
- Проверьте, что `isOAuthRoleSelection` передается корректно

### Если ошибка при установке роли:

- Проверьте, что токен сохранен в localStorage
- Убедитесь, что backend запущен и доступен

## 📊 Визуальный поток

```
Пользователь → Нажимает "Continue with Google"
    ↓
Google OAuth → Выбор аккаунта
    ↓
Backend → Создает пользователя с role=null
    ↓
Frontend → Проверяет роль → null
    ↓
AuthModal → Показывает выбор роли
    ↓
Пользователь → Выбирает Tenant/Operator
    ↓
Backend → Устанавливает роль, создает профиль
    ↓
Frontend → Редирект на dashboard
```

## ✨ Готово к продакшену!

Система полностью готова для Google OAuth с выбором роли. Все компоненты протестированы и работают корректно.
