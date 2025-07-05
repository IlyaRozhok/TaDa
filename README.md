# TaDa - Rental Platform 🏠

Современная платформа для аренды недвижимости, соединяющая арендаторов и операторов недвижимости через умное сопоставление.

## 🚀 Архитектура проекта

### Backend (NestJS)

- **API**: RESTful API с документацией Swagger
- **База данных**: PostgreSQL с TypeORM
- **Аутентификация**: JWT токены с ролевой моделью
- **Загрузка файлов**: Multer для изображений недвижимости
- **Умное сопоставление**: Алгоритм с весовыми коэффициентами

### Frontend (Next.js)

- **Framework**: Next.js 15 с App Router
- **UI**: Tailwind CSS + Lucide React иконки
- **Состояние**: Redux Toolkit + RTK Query
- **Формы**: React Hook Form + Zod валидация
- **Типизация**: TypeScript в strict режиме

## 📋 Что реализовано

### ✅ Backend MVP (Полностью готов)

- Полная архитектура NestJS с модулями
- PostgreSQL + TypeORM с миграциями
- JWT аутентификация с ролями (tenant/operator)
- CRUD для пользователей, недвижимости, предпочтений
- Умный алгоритм сопоставления с весами
- Система shortlist для арендаторов
- Загрузка изображений недвижимости
- API документация Swagger
- Docker контейнеризация

### ✅ Frontend MVP (Базовая версия)

- Красивая лэндинг страница
- Регистрация для арендаторов и операторов
- Вход в систему с JWT
- Личные кабинеты для обоих типов пользователей
- Redux store с RTK Query
- Адаптивный дизайн
- TypeScript интеграция

### 🎯 Готово к использованию

- Регистрация и авторизация
- Управление профилями
- Добавление и управление недвижимостью (операторы)
- Настройка предпочтений (арендаторы)
- Умное сопоставление недвижимости
- Система избранного
- API для всех операций

## 🏃‍♂️ Быстрый старт

### 1. Клонирование и установка

\`\`\`bash
git clone <repository>
cd TaDa
\`\`\`

### 2. Запуск Backend

\`\`\`bash

# Запуск PostgreSQL через Docker

docker-compose up -d postgres

# Установка зависимостей backend

cd backend
npm install

# Конфигурация

cp .env.example .env

# Отредактируйте .env файл

# Запуск миграций

npm run migration:run

# Запуск dev сервера

npm run start:dev
\`\`\`
**Backend доступен**: http://localhost:5000
**API Docs**: http://localhost:5000/api/docs

### 3. Запуск Frontend

\`\`\`bash

# В новом терминале

cd frontend
npm install

# Конфигурация

echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Запуск dev сервера

npm run dev
\`\`\`
**Frontend доступен**: http://localhost:3000

## 📊 Схема данных

### User (Пользователи)

- Базовая информация + демографические данные
- Роли: tenant (арендатор) / operator (оператор)
- Lifestyle предпочтения и характеристики

### Property (Недвижимость)

- Полная информация об объекте
- Геолокация и транспортная доступность
- Множественные изображения
- Связь с оператором

### Preferences (Предпочтения)

- Локация и ценовой диапазон
- Времена коммутации (пешком/велосипед/метро)
- Множественные фильтры по характеристикам
- Lifestyle требования

### Shortlist (Избранное)

- Связь арендатор-недвижимость
- Система лайков и рекомендаций

## 🧠 Умное сопоставление

Алгоритм учитывает:

- **Цена** (соответствие бюджету)
- **Локация** (первичная/вторичная зоны)
- **Характеристики** (lifestyle, удобства, люкс)
- **Тип недвижимости** (квартира, дом, студия)
- **Время коммутации** (расчетное время до работы)

Система весов (1-10) для кастомизации важности факторов.

## 🔧 Технические особенности

### Backend

- Модульная архитектура NestJS
- TypeORM entities с relationships
- JWT Guards + Role-based access
- File upload с валидацией
- Comprehensive DTOs
- Error handling
- API versioning ready

### Frontend

- App Router Next.js 15
- Server/Client components
- Redux Toolkit state management
- RTK Query для API
- Responsive Tailwind CSS
- TypeScript strict mode
- Component library

## 📱 Страницы и функции

### Общедоступные

- ✅ **Лэндинг**: Презентация платформы
- ✅ **Регистрация**: Выбор роли + детальные формы
- ✅ **Вход**: JWT аутентификация

### Для арендаторов

- ✅ **Dashboard**: Обзор активности
- ⏳ **Поиск**: Фильтры и каталог недвижимости
- ⏳ **Сопоставления**: Умные рекомендации
- ⏳ **Избранное**: Shortlist объектов
- ⏳ **Настройки**: Управление предпочтениями

### Для операторов

- ✅ **Dashboard**: Статистика и управление
- ⏳ **Мои объекты**: Портфолио недвижимости
- ⏳ **Добавить объект**: Загрузка новых объектов
- ⏳ **Арендаторы**: Заинтересованные кандидаты
- ⏳ **Аналитика**: Просмотры и статистика

## 🛠 Development

### Backend команды

\`\`\`bash
npm run start:dev # Dev сервер
npm run build # Production сборка
npm run migration:run # Применить миграции
npm run test # Запуск тестов
\`\`\`

### Frontend команды

\`\`\`bash
npm run dev # Dev сервер
npm run build # Production сборка
npm run lint # ESLint проверка
npm run type-check # TypeScript проверка
\`\`\`

## 📚 API Endpoints

### Аутентификация

- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход

### Пользователи

- `GET /users/profile` - Профиль
- `PUT /users/profile` - Обновление профиля

### Недвижимость

- `GET /properties` - Список с фильтрами
- `POST /properties` - Создание (операторы)
- `GET /properties/:id` - Детали объекта
- `GET /properties/my-properties` - Мои объекты

### Сопоставление

- `GET /matching/matches` - Умные рекомендации
- `POST /matching/shortlist/:id` - Добавить в избранное
- `GET /matching/shortlist` - Мой shortlist

### Предпочтения

- `POST /preferences` - Создать предпочтения
- `PUT /preferences` - Обновить предпочтения

## 🚦 Статус проекта

**Текущий статус**: MVP Backend готов + Frontend базовая версия

### Следующие этапы:

1. **Завершение Frontend** - страницы недвижимости и сопоставления
2. **Интеграция карт** - Google Maps/Mapbox
3. **Real-time уведомления** - WebSocket
4. **Мобильная оптимизация** - PWA
5. **Аналитика** - пользовательские метрики
6. **Тестирование** - E2E тесты

## 📄 Документация

- [Backend README](./backend/README.md) - Подробная документация API
- [Frontend README](./README-frontend.md) - Документация по UI
- [API Swagger](http://localhost:5000/api/docs) - Интерактивная документация

## 🤝 Contribution

Проект готов для дальнейшей разработки. Основная архитектура и MVP функциональность реализованы.

## 📞 Поддержка

Backend: NestJS + PostgreSQL + TypeORM
Frontend: Next.js + Redux + Tailwind
Deployment: Docker ready

---

**TaDa** - найди свой идеальный дом! 🏠✨
