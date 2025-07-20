# 🔧 Решение проблемы доступа к Admin Panel

## 🚨 Проблема

Администратор не может нажать кнопку "Admin Panel" - она не отображается или недоступна.

## 🔍 Диагностика

### 1. Включите Debug Panel (только в development)

Debug панель автоматически появляется в правом нижнем углу в development режиме и покажет:

- ✅ Authenticated: статус аутентификации
- 👤 User details: ID, email, роль
- 🔍 Role detection: как определяется роль
- ⚙️ Admin status: должна ли показываться кнопка

### 2. Основные причины проблемы

#### A) **Роль не установлена в базе данных**

- `user.role` должна быть `"admin"`
- Проверьте в debug панели поле `user.role field`

#### B) **JWT токен устарел**

- Токен был создан до изменения роли
- Нужно обновить токен после изменения роли

#### C) **Роль не передается в JWT payload**

- Проверьте backend JWT strategy

## ✅ Пошаговое решение

### Шаг 1: Назначить роль администратора

**Способ 1: Через backend скрипт (рекомендуется)**

```bash
# Перейти в директорию backend
cd backend

# Запустить скрипт для назначения admin роли
npx ts-node scripts/make-user-admin.ts user@example.com
```

**Способ 2: Прямо в базе данных**

```sql
UPDATE users SET role = 'admin', status = 'active'
WHERE email = 'user@example.com';
```

### Шаг 2: Обновить JWT токен

**Способ 1: Через Debug Panel**

1. Нажмите кнопку "🔄 Refresh Profile"
2. Страница перезагрузится с новым токеном

**Способ 2: Перелогиниться**

1. Нажмите кнопку "🚪 Logout & Login Again"
2. Войдите снова - получите новый токен с admin ролью

**Способ 3: Вручную**

1. Выйдите из аккаунта
2. Войдите снова
3. Новый JWT токен будет включать роль admin

### Шаг 3: Проверить результат

После выполнения шагов 1-2:

- ✅ В debug панели должно быть `isAdmin: TRUE`
- ✅ В header появится кнопка "Admin Panel"
- ✅ Доступ к `/app/admin/panel` будет разрешен

## 🛠️ Готовые команды

### Список всех пользователей

```bash
cd backend
npx ts-node scripts/make-user-admin.ts
# Без параметров покажет всех пользователей
```

### Сделать пользователя админом

```bash
cd backend
npx ts-node scripts/make-user-admin.ts admin@example.com
```

### Проверить JWT токен (в браузере)

```javascript
// В Developer Tools > Console
const token = localStorage.getItem("accessToken");
if (token) {
  console.log("JWT payload:", JSON.parse(atob(token.split(".")[1])));
}
```

## 🔍 Дополнительная диагностика

### Проверить в браузере

1. Откройте Developer Tools (F12)
2. Console > выполните:

```javascript
// Проверить текущего пользователя
console.log(
  "Current user:",
  JSON.parse(localStorage.getItem("user") || "null")
);

// Проверить токен
const token = localStorage.getItem("accessToken");
if (token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  console.log("JWT payload:", payload);
  console.log("Token role:", payload.role);
}
```

### Backend логи

Проверьте логи JWT strategy в backend:

```bash
cd backend
npm run start:dev
# Смотрите в консоли сообщения типа:
# "🔍 JWT Strategy validate called with payload"
# "✅ User found: { role: 'admin' }"
```

## 🚀 Быстрое решение

**Если нужно срочно:**

1. Остановите backend: `Ctrl+C`
2. Выполните: `npx ts-node scripts/make-user-admin.ts your@email.com`
3. Запустите backend: `npm run start:dev`
4. В frontend: Logout → Login
5. ✅ Admin Panel должна появиться!

## ❓ Часто задаваемые вопросы

**Q: Кнопка все еще не появляется**
A: Проверьте debug панель - возможно role still null или токен не обновился

**Q: Debug панель не видна**
A: Убедитесь, что `NODE_ENV=development` в frontend

**Q: Ошибка "Database connection failed"**
A: Убедитесь, что база данных запущена и настройки подключения корректны

**Q: После назначения роли токен не обновился**
A: JWT токены не обновляются автоматически - нужен logout/login

## 🎯 Итоговая проверка

После выполнения всех шагов:

- [ ] `user.role` = `"admin"` в debug панели
- [ ] `isAdmin` = `TRUE` в debug панели
- [ ] Кнопка "Admin Panel" видна в header
- [ ] Переход на `/app/admin/panel` работает
- [ ] Toast уведомления работают в админке

✅ **Готово!** Администратор теперь имеет полный доступ к админской панели.
