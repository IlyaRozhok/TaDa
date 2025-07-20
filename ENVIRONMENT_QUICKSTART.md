# TaDa Environment Quick Start

## 🚀 Быстрый старт

### Локальная разработка

```bash
# 1. Клонируем репозиторий
git clone https://github.com/your-org/tada.git
cd tada

# 2. Устанавливаем зависимости
npm run install:all

# 3. Настраиваем локальную среду
npm run setup:local

# 4. Обновляем .env файлы своими данными
# backend/.env
# frontend/.env.local

# 5. Запускаем через Docker (рекомендуется)
npm run docker:local

# ИЛИ запускаем без Docker
npm run dev
```

### Тестовая среда

```bash
# 1. Настраиваем среду
npm run setup:test

# 2. Обновляем креденшалы в backend/.env
# - Добавляем реальные AWS ключи
# - Проверяем DB_HOST и DB_PORT

# 3. Деплоим на VPS
npm run deploy:test
```

## 📁 Структура файлов конфигурации

```
tada/
├── backend/
│   ├── .env                    # Основной файл конфигурации (не в git)
│   └── config/
│       ├── env.local.example   # Пример для локальной среды
│       ├── env.test.example    # Пример для тестовой среды
│       └── env.production.example # Пример для продакшна
├── frontend/
│   ├── .env.local             # Основной файл конфигурации (не в git)
│   └── config/
│       ├── env.local.example
│       ├── env.test.example
│       └── env.production.example
└── scripts/
    ├── env-setup.sh           # Скрипт настройки среды
    └── deploy-test.sh         # Скрипт деплоя на тест
```

## 🔑 Важные переменные окружения

### Backend обязательные:

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `FRONTEND_URL`

### Frontend обязательные:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`

## 🐳 Docker команды

```bash
# Локальная среда с всеми сервисами
npm run docker:local

# Только база данных
docker-compose -f docker-compose.local.yml up postgres

# Перезапуск конкретного сервиса
docker-compose -f docker-compose.local.yml restart backend
```

## 🔍 Проверка работоспособности

### Local

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- PgAdmin: http://localhost:5050

### Test

- Frontend: https://tada.illiacodes.dev
- Backend API: https://api.tada.illiacodes.com/api

## ⚠️ Частые проблемы

### CORS ошибки

```bash
# Проверьте CORS_ORIGIN в backend/.env
CORS_ORIGIN=http://localhost:3000  # для local
CORS_ORIGIN=https://tada.illiacodes.dev  # для test
```

### База данных недоступна

```bash
# Local: проверьте что PostgreSQL запущен
docker-compose -f docker-compose.local.yml ps

# Test: проверьте подключение к VPS
telnet 95.217.7.37 5433
```

### Google OAuth не работает

```bash
# Проверьте callback URL
GOOGLE_CALLBACK_URL=http://localhost:5001/auth/google/callback  # local
GOOGLE_CALLBACK_URL=https://api.tada.illiacodes.com/auth/google/callback  # test
```

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте логи: `docker-compose logs -f [service-name]`
2. Обратитесь к полной документации: [ENVIRONMENTS.md](./ENVIRONMENTS.md)
3. Создайте issue в репозитории
