# 🔍 Пошаговый тест Google OAuth с выбором роли

## ✅ Диагностика backend (уже проверено)

```bash
cd backend
npx ts-node scripts/debug-google-oauth-flow.ts
```

**Результат:** Backend работает правильно! Создает пользователей с `role: null`.

## 🚀 Ручной тест frontend flow

### Подготовка:

1. Запустите backend: `cd backend && npm run start:dev`
2. Запустите frontend: `cd frontend && npm run dev`
3. Откройте браузер: `http://localhost:3000`
4. Откройте DevTools → Console (F12)

### Пошаговый тест:

#### **Шаг 1: Очистка данных**

```javascript
localStorage.clear();
sessionStorage.clear();
```

#### **Шаг 2: Открытие AuthModal**

- Нажмите кнопку "Sign In" на главной странице
- **Ожидается:** Откроется AuthModal с формой входа

#### **Шаг 3: Google OAuth**

- Нажмите "Continue with Google"
- **В консоли должно быть:**
  ```
  🔍 AuthModal - Google Auth button clicked
  🔍 Redirecting to: http://localhost:5001/api/auth/google
  ```

#### **Шаг 4: Google аутентификация**

- Выберите Google аккаунт (используйте НОВЫЙ email!)
- **Backend логи должны показать:**
  ```
  ✅ Created new user from Google OAuth (no role yet): [email]
  ✅ GoogleAuth successful: { userRole: null, isNewUser: true }
  ```

#### **Шаг 5: Frontend callback**

- После возврата из Google в консоли браузера:
  ```
  🔍 OAuth callback parameters: { isNewUser: true }
  🔍 Profile response: { userRole: null }
  ✅ User has no role - redirecting to role selection
  ```

#### **Шаг 6: Главная страница**

- **В консоли должно быть:**
  ```
  🔍 Home page - checking needsRole parameter: { needsRole: "true" }
  ✅ Home page - needs role selection, opening AuthModal
  ```

#### **Шаг 7: AuthModal с выбором роли**

- **В консоли должно быть:**
  ```
  🔍 AuthModal - checking forceRoleSelection: {
    forceRoleSelection: true,
    isOAuthRoleSelection: true
  }
  ✅ AuthModal - forcing role selection step
  ```
- **На экране должно быть:** Выбор между Tenant и Operator

#### **Шаг 8: Выбор роли**

- Выберите роль (Tenant или Operator) и нажмите "Continue"
- **В консоли должно быть:**
  ```
  🔍 AuthModal - handling role submit: {
    selectedRole: "tenant",
    isOAuthRoleSelection: true
  }
  ✅ AuthModal - calling setRole API for OAuth user
  ✅ AuthModal - setRole successful
  ```

#### **Шаг 9: Успешное завершение**

- **Результат:** Перенаправление на dashboard
- **Backend должен создать:** Профиль и preferences для выбранной роли

## 🚨 Возможные проблемы:

### **Проблема 1: AuthModal не показывает выбор роли**

**Симптомы:**

- Показывается форма входа вместо выбора роли
- В консоли нет `✅ AuthModal - forcing role selection step`

**Проверить:**

- `forceRoleSelection` передается в AuthModal?
- `isOAuthRoleSelection` установлен правильно?

### **Проблема 2: needsRole параметр не обрабатывается**

**Симптомы:**

- Нет редиректа на `/?needsRole=true`
- AuthModal не открывается автоматически

**Проверить:**

- В callback/page.tsx проверка `user.role === null`?
- В page.tsx обработка параметра `needsRole`?

### **Проблема 3: setRole API не вызывается**

**Симптомы:**

- При нажатии "Continue" ничего не происходит
- Нет логов `calling setRole API`

**Проверить:**

- `isOAuthRoleSelection` правильно передается?
- Токен сохранен в localStorage?

## 🔧 Быстрые исправления:

### Если AuthModal закрывается сразу после OAuth:

```javascript
// В AuthModal.tsx - проверить этот useEffect:
useEffect(() => {
  if (isAuthenticated && !isOAuthRoleSelection) {
    onClose();
    router.push("/app/dashboard");
  }
}, [isAuthenticated, isOAuthRoleSelection, onClose, router]);
```

### Если не показывается выбор роли:

```javascript
// В page.tsx проверить передачу props:
<AuthModal
  isOpen={authModalOpen}
  onClose={() => {
    setAuthModalOpen(false);
    setNeedsRoleSelection(false);
  }}
  forceRoleSelection={needsRoleSelection}
  isOAuthRoleSelection={needsRoleSelection}
/>
```

## 🎯 Контрольные точки:

- [ ] Backend создает пользователя с `role: null`
- [ ] Frontend получает `isNewUser: true`
- [ ] Происходит redirect на `/?needsRole=true`
- [ ] AuthModal открывается с выбором роли
- [ ] При выборе роли вызывается `setRole` API
- [ ] Создается профиль и preferences
- [ ] Перенаправление на dashboard

**Протестируйте каждый шаг и найдите где именно ломается логика!**
