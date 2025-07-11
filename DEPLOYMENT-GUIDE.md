# 🚀 TaDa Full Stack Deployment Guide

Этот гайд поможет вам развернуть полный стейдж TaDa для демонстрации.

## 🏗️ Архитектура стейджа

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Vercel)      │───▶│   (Railway)     │───▶│ (PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   File Storage  │
                       │   (AWS S3)      │
                       └─────────────────┘
```

## 📋 Что нужно для развертывания

### 1. Сервисы которые нужно настроить:

- **Vercel** (Frontend) - бесплатно
- **Railway** (Backend + Database) - $5/месяц
- **AWS S3** (File Storage) - ~$1/месяц

### 2. Учетные записи:

- GitHub (уже есть)
- Vercel.com
- Railway.app
- AWS (для S3)

## 🔧 Пошаговое развертывание

### STEP 1: Подготовка репозитория

```bash
# Коммитим все изменения
git add .
git commit -m "Prepare for full stack deployment"
git push origin main
```

### STEP 2: Развертывание Backend (Railway)

1. **Создайте аккаунт на Railway.app**
2. **Создайте новый проект**:

   - Connect GitHub repository
   - Выберите репозиторий TaDa
   - Укажите Root Directory: `backend`

3. **Добавьте переменные окружения**:

   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-here
   DATABASE_URL=postgresql://username:password@host:port/database
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=eu-west-1
   AWS_S3_BUCKET_NAME=tada-demo-bucket
   ```

4. **Добавьте PostgreSQL базу данных**:

   - В Railway dashboard добавьте PostgreSQL
   - Скопируйте DATABASE_URL в переменные окружения

5. **Deploy Backend**

### STEP 3: Настройка S3 Bucket

1. **Создайте S3 bucket**:

   - Название: `tada-demo-bucket`
   - Region: `eu-west-1`
   - Public access: Enabled for uploads

2. **Настройте CORS**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### STEP 4: Развертывание Frontend (Vercel)

1. **Создайте новый проект в Vercel**:

   - Import Git Repository
   - Выберите TaDa repository
   - **Root Directory**: `frontend`

2. **Настройте переменные окружения**:

   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

3. **Deploy Frontend**

### STEP 5: Инициализация базы данных

После развертывания backend:

```bash
# Подключитесь к Railway CLI
railway login

# Запустите миграции
railway run npm run migration:run

# Запустите сидеры
railway run npm run seed
```

## 🔧 Исправление текущей проблемы Vercel

### Вариант 1: Обновить настройки проекта

1. Зайдите в Vercel dashboard
2. Перейдите в Settings → General
3. Измените Root Directory с `./frontend` на `frontend`
4. Redeploy

### Вариант 2: Удалить и создать заново

1. Удалите текущий проект в Vercel
2. Создайте новый проект
3. Укажите Root Directory: `frontend` (без точки)

## 📱 Быстрое решение для демо

Если нужно быстро развернуть только frontend для демо:

```bash
# Создайте отдельный репозиторий только для frontend
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/your-username/tada-frontend.git
git push -u origin main

# Затем деплойте этот репозиторий в Vercel
```

## 🔧 Environment Variables для Production

### Backend (Railway):

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=super-secret-key
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_S3_BUCKET_NAME=tada-demo-bucket
```

### Frontend (Vercel):

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## 🚀 После развертывания

1. **Протестируйте все функции**:

   - Регистрация/авторизация
   - Создание properties
   - Загрузка изображений
   - Matching система

2. **Настройте домены** (опционально):
   - Frontend: custom-domain.com
   - Backend: api.custom-domain.com

## 📞 Поддержка

Если возникают проблемы:

1. Проверьте логи в Railway/Vercel
2. Убедитесь что все environment variables установлены
3. Проверьте CORS настройки
4. Убедитесь что S3 bucket доступен
