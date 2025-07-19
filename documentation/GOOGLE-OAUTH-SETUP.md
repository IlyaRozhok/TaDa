# Google OAuth Setup Guide

## 1. Настройка Google Cloud Console

### Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API (если требуется)

### Шаг 2: Настройка OAuth 2.0

1. Перейдите в раздел "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "OAuth 2.0 Client ID"
3. Выберите "Web application"
4. Настройте authorized redirect URIs:
   - Для разработки: `http://localhost:5001/auth/google/callback`
   - Для продакшена: `https://yourdomain.com/auth/google/callback`

### Шаг 3: Получение учетных данных

1. Скопируйте `Client ID` и `Client Secret`
2. Сохраните их в безопасном месте

## 2. Настройка Backend

### Переменные окружения

Создайте файл `.env` в папке `backend/` со следующими переменными:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=rental_platform

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_ACCESS_EXPIRES_IN=1d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/auth/google/callback

# AWS S3 Configuration (если используется)
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Application Configuration
NODE_ENV=development
PORT=5001
```

### Зависимости

Убедитесь, что установлены следующие пакеты:

```bash
npm install passport-google-oauth20 @types/passport-google-oauth20
```

## 3. Настройка Frontend

### Переменные окружения

Создайте файл `.env.local` в папке `frontend/` со следующими переменными:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 4. Запуск приложения

### Backend

```bash
cd backend
npm run start:dev
```

### Frontend

```bash
cd frontend
npm run dev
```

## 5. Тестирование

### Проверка эндпоинтов

1. Откройте браузер и перейдите на `http://localhost:5001/auth/google`
2. Вы должны быть перенаправлены на страницу авторизации Google
3. После успешной авторизации вы должны быть перенаправлены на `http://localhost:3000/app/auth/callback`

### Проверка пользователя

1. Войдите через Google OAuth
2. Проверьте, что пользователь создан в базе данных
3. Убедитесь, что создан профиль tenant и preferences

## 6. Troubleshooting

### Частые проблемы

#### 1. "redirect_uri_mismatch"

**Проблема**: OAuth callback URL не совпадает с настроенным в Google Cloud Console
**Решение**: Проверьте, что `GOOGLE_CALLBACK_URL` совпадает с authorized redirect URI в Google Cloud Console

#### 2. "Client configuration not found"

**Проблема**: Неправильно настроен Client ID или Secret
**Решение**:

- Проверьте переменные `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`
- Убедитесь, что они скопированы правильно из Google Cloud Console

#### 3. "Invalid token"

**Проблема**: Проблемы с JWT токеном
**Решение**: Проверьте настройку `JWT_SECRET` и убедитесь, что она одинакова во всех местах

#### 4. "CORS error"

**Проблема**: Проблемы с CORS при OAuth
**Решение**: Убедитесь, что в `main.ts` настроен правильный CORS для frontend URL

### Логирование

Для отладки включите логирование в backend:

```typescript
// В auth.controller.ts
console.log("Google OAuth callback:", req.user);
```

### Проверка базы данных

Убедитесь, что выполнены все миграции:

```bash
cd backend
npm run typeorm:migration:run
```

### Проверка пользователя в базе данных

```sql
SELECT * FROM users WHERE provider = 'google';
SELECT * FROM tenant_profiles WHERE "userId" IN (SELECT id FROM users WHERE provider = 'google');
```

## 7. Продакшн

### Безопасность

1. Используйте HTTPS для всех OAuth callback URLs
2. Используйте сильные JWT secrets
3. Настройте правильные CORS origins
4. Используйте переменные окружения для всех секретов

### Домены

Обновите следующие настройки для продакшена:

- `GOOGLE_CALLBACK_URL` → `https://yourdomain.com/auth/google/callback`
- `FRONTEND_URL` → `https://yourdomain.com`
- Authorized redirect URIs в Google Cloud Console

## 8. Дополнительные возможности

### Получение дополнительных данных профиля

В `google.strategy.ts` можно расширить scope:

```typescript
scope: ["email", "profile", "openid"];
```

### Обработка ошибок

Callback страница уже содержит обработку ошибок и перенаправление в случае проблем.

### Интеграция с существующими пользователями

Система проверяет существующих пользователей по email и предотвращает конфликты провайдеров.

---

## Поддержка

Если у вас возникли проблемы с настройкой Google OAuth, проверьте:

1. Все переменные окружения настроены правильно
2. Все миграции выполнены
3. Backend и frontend запущены
4. Google Cloud Console настроен правильно
5. Нет ошибок в консоли браузера или логах сервера
