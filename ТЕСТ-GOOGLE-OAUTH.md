# 🚀 ТЕСТ: Google OAuth с выбором роли

## ✅ Система готова к тестированию!

**Backend:** Создает пользователей с `role: null` ✅  
**Frontend:** Показывает выбор роли после OAuth ✅  
**API:** Устанавливает роль и создает профили ✅

---

## 🧪 Пошаговое тестирование

### **Подготовка:**

```bash
# Терминал 1 - Backend
cd backend && npm run start:dev

# Терминал 2 - Frontend
cd frontend && npm run dev

# Браузер
http://localhost:3000
```

### **Шаг 1: Очистка данных**

```javascript
// В консоли браузера (F12)
localStorage.clear();
sessionStorage.clear();
```

### **Шаг 2: Тестирование нового пользователя**

1. **Нажмите "Sign Up"** → AuthModal откроется
2. **Нажмите "Continue with Google"**
3. **Выберите НОВЫЙ Google аккаунт** (которого нет в базе)

### **Шаг 3: Ожидаемый результат**

После входа через Google должно произойти:

✅ **Backend логи:**

```
✅ Created new user from Google OAuth (no role yet): [email]
✅ GoogleAuth successful: { userRole: null, isNewUser: true }
```

✅ **Frontend консоль:**

```
🔍 OAuth callback parameters: { isNewUser: true }
🔍 Profile response: { userRole: null }
✅ User has no role - redirecting to role selection
🔍 Home page - needs role selection, opening AuthModal
✅ AuthModal - forcing role selection step
```

✅ **На экране:** Выбор между "I'm looking for a place" и "I have properties to rent"

### **Шаг 4: Выбор роли**

1. **Выберите роль** (Tenant или Operator)
2. **Нажмите "Continue"**

✅ **В консоли должно быть:**

```
🔍 AuthModal - calling setRole API for OAuth user
✅ AuthModal - setRole successful
```

✅ **Результат:** Перенаправление на dashboard соответствующей роли

---

## 🚨 Если что-то не работает:

### **Проблема 1: Показывается форма входа вместо выбора роли**

**Диагностика:**

1. Откройте Network tab в DevTools
2. Проверьте вызов `/auth/me` после OAuth callback
3. Убедитесь что `user.role === null` в ответе

**Исправление:** Проверить backend логику создания пользователя

### **Проблема 2: AuthModal закрывается сразу после OAuth**

**Диагностика:**

1. Проверьте консоль на наличие логов `"forcing role selection"`
2. Убедитесь что `needsRole=true` в URL

**Исправление:** Проверить callback логику в `auth/callback/page.tsx`

### **Проблема 3: Ошибка при вызове setRole API**

**Диагностика:**

1. Network tab → проверить вызов `POST /auth/set-role`
2. Проверить наличие токена в localStorage
3. Проверить backend логи

---

## 🎯 Контрольный список:

- [ ] Новый пользователь создается с `role: null`
- [ ] Происходит redirect на `/?needsRole=true`
- [ ] AuthModal открывается с выбором роли
- [ ] При выборе роли вызывается `setRole` API
- [ ] Создается профиль и preferences в базе
- [ ] Перенаправление на соответствующий dashboard

---

## 📊 Схема потока:

```
Пользователь нажимает Google
    ↓
Google OAuth → Backend создает user (role: null)
    ↓
Frontend callback → Проверяет role === null
    ↓
Redirect: /?needsRole=true
    ↓
Главная страница → Открывает AuthModal
    ↓
AuthModal → Показывает выбор роли
    ↓
Пользователь выбирает → Вызывает setRole API
    ↓
Backend → Устанавливает роль, создает профиль
    ↓
Frontend → Redirect на dashboard
```

**🎉 Система полностью готова к использованию!**
