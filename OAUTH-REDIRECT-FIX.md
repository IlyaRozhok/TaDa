# Исправление ошибки redirect_uri_mismatch

## ❌ Проблема

Получаете ошибку `400: redirect_uri_mismatch` при попытке войти через Google OAuth.

## 🔍 Диагностика

Запустите скрипт диагностики:

```bash
cd backend
npm run diagnose:oauth
```

## 🔧 Быстрое исправление

### 1. Проверьте файл `.env` в папке `backend/`

**Должно быть:**

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

**❌ Частые ошибки:**

- `https://localhost:5001` (должно быть `http://`)
- `http://localhost:3000` (должно быть `:5001`)
- `/callback` без `/auth/google/`

### 2. Настройте Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите в **"APIs & Services"** > **"Credentials"**
4. Найдите ваш **OAuth 2.0 Client ID**
5. Нажмите на него для редактирования
6. В разделе **"Authorized redirect URIs"** добавьте:
   ```
   http://localhost:5001/auth/google/callback
   ```
7. Нажмите **"Save"**

### 3. Проверьте порт backend

Backend должен запускаться на порту **5001**:

```bash
cd backend
npm run start:dev
```

Должно показать:

```
🚀 Application is running on: http://localhost:5001
```

### 4. Тест

Откройте в браузере:

```
http://localhost:5001/auth/google
```

Должно перенаправить на Google без ошибок.

## 📋 Полная проверка

### Шаг 1: Проверка переменных окружения

```bash
cd backend
npm run diagnose:oauth
```

### Шаг 2: Проверка Google Cloud Console

- Проект выбран правильно
- OAuth Client ID создан
- Authorized redirect URIs содержит правильный URL
- OAuth consent screen настроен

### Шаг 3: Проверка backend

```bash
curl -I http://localhost:5001/auth/google
```

Должно вернуть `302 Found` с redirect на `accounts.google.com`.

### Шаг 4: Проверка полного flow

1. Откройте: `http://localhost:5001/auth/google`
2. Войдите в Google
3. Должно перенаправить на: `http://localhost:3000/app/auth/callback`

## 🆘 Все еще не работает?

### Проверьте логи backend

Backend выводит подробные логи с символами 🔍 и ✅:

```bash
cd backend
npm run start:dev
```

### Общие проблемы:

1. **Неправильный проект в Google Cloud Console**

   - Убедитесь, что выбран правильный проект
   - Client ID и Secret взяты из правильного проекта

2. **Кэширование браузера**

   - Очистите кэш браузера
   - Попробуйте в режиме инкогнито

3. **Неправильный порт**

   - Backend: `5001`
   - Frontend: `3000`

4. **Переменные окружения не загружены**
   - Перезапустите backend после изменения `.env`
   - Проверьте путь к файлу `.env`

### Контрольный список:

- [ ] Файл `backend/.env` содержит правильные переменные
- [ ] Google Cloud Console настроен правильно
- [ ] Backend запущен на порту 5001
- [ ] Frontend запущен на порту 3000
- [ ] Нет опечаток в URLs
- [ ] Проект в Google Cloud Console активен

## 🔗 Полезные ссылки

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**💡 Совет:** Всегда используйте `npm run diagnose:oauth` для быстрой диагностики проблем с OAuth!
