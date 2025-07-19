# 🚀 Быстрое развертывание TaDa Platform на VPS

## ⚡ Быстрый старт

### 1. Подготовка VPS (Ubuntu 20.04+)

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Настройка файрвола
sudo ufw allow ssh && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable

# Перезапуск сессии
exit
```

### 2. Развертывание приложения

```bash
# Клонирование репозитория
git clone https://github.com/IlyaRozhok/TaDa.git
cd TaDa

# Настройка переменных окружения
cp env.production.template .env
nano .env  # Заполните все переменные

# Генерация JWT секрета
openssl rand -base64 32

# Автоматическое развертывание
./scripts/deploy.sh

# Настройка SSL
./scripts/setup-ssl.sh
```

## 🔧 Основные команды

### Управление приложением

```bash
# Запуск
docker-compose -f docker-compose.prod.yml up -d

# Остановка
docker-compose -f docker-compose.prod.yml down

# Перезапуск
docker-compose -f docker-compose.prod.yml restart

# Обновление
git pull && docker-compose -f docker-compose.prod.yml up -d --build
```

### Мониторинг

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Использование ресурсов
docker stats

# Здоровье приложения
curl https://yourdomain.com/health
```

### Резервное копирование

```bash
# Создание бэкапа БД
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U tada_user tada_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление БД
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U tada_user tada_production < backup_file.sql
```

## 📁 Структура проекта

```
TaDa/
├── backend/                 # API сервер (NestJS)
├── frontend/               # Веб-приложение (Next.js)
├── nginx/                  # Конфигурация веб-сервера
├── scripts/                # Скрипты развертывания
├── docker-compose.prod.yml # Production конфигурация
├── env.production.template # Шаблон переменных окружения
└── VPS-DEPLOYMENT-GUIDE.md # Подробная инструкция
```

## 🔐 Обязательные переменные окружения

```env
# База данных
DB_USERNAME=tada_user
DB_PASSWORD=StrongPassword123!
DB_NAME=tada_production

# JWT
JWT_SECRET=your-32-character-secret-key

# Домен
DOMAIN=yourdomain.com
EMAIL=your-email@example.com
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# AWS S3 (опционально)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-central-1
AWS_S3_BUCKET_NAME=your-bucket
```

## 🛠️ Устранение неполадок

### Проблема: Контейнеры не запускаются

```bash
docker-compose -f docker-compose.prod.yml logs
df -h  # Проверить свободное место
free -h  # Проверить память
```

### Проблема: SSL не работает

```bash
ls -la ssl/  # Проверить сертификаты
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
./scripts/setup-ssl.sh  # Переустановить SSL
```

### Проблема: База данных недоступна

```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U tada_user -d tada_production
```

## 📞 Поддержка

- **Полная инструкция:** [VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)
- **Проблемы Vercel:** [VERCEL_DEPLOYMENT_ISSUES.md](VERCEL_DEPLOYMENT_ISSUES.md)

## 🎉 Результат

После успешного развертывания:

- **Сайт:** https://yourdomain.com
- **API:** https://yourdomain.com/api
- **Здоровье:** https://yourdomain.com/health

---

**Время развертывания:** ~10-15 минут  
**Требования:** 2GB RAM, 20GB диск, Ubuntu 20.04+
