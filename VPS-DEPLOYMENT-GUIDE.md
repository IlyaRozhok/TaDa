# 🚀 Полная инструкция по развертыванию TaDa Platform на VPS

## 📋 Предварительные требования

### 1. VPS сервер

- **ОС:** Ubuntu 20.04 LTS или выше
- **Память:** минимум 2GB RAM (рекомендуется 4GB+)
- **Диск:** минимум 20GB свободного места
- **CPU:** минимум 2 ядра

### 2. Домен

- Зарегистрированный домен (например, `yourdomain.com`)
- DNS записи настроены на IP вашего VPS

### 3. Подготовка VPS

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl wget git ufw

# Настройка файрвола
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. Установка Docker и Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезапуск сессии для применения изменений
exit
```

Подключитесь к VPS заново после выполнения команд выше.

## 🔧 Развертывание приложения

### 1. Клонирование репозитория

```bash
# Клонирование проекта
git clone https://github.com/IlyaRozhok/TaDa.git
cd TaDa

# Проверка файлов
ls -la
```

### 2. Настройка переменных окружения

```bash
# Копирование шаблона
cp env.production.template .env

# Редактирование файла
nano .env
```

**Заполните следующие обязательные переменные:**

```env
# Database Configuration
DB_USERNAME=tada_user
DB_PASSWORD=VeryStrongPassword123!
DB_NAME=tada_production

# JWT Configuration (генерируйте сильный ключ)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# AWS S3 Configuration (если используете S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-central-1
AWS_S3_BUCKET_NAME=your-bucket-name

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Frontend API URL
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Domain Configuration
DOMAIN=yourdomain.com
EMAIL=your-email@example.com
```

### 3. Генерация сильного JWT секрета

```bash
# Генерация случайного ключа
openssl rand -base64 32

# Или используйте
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Запуск автоматического развертывания

```bash
# Сделать скрипт исполняемым
chmod +x scripts/deploy.sh

# Запустить развертывание
./scripts/deploy.sh
```

### 5. Проверка развертывания

```bash
# Проверка статуса контейнеров
docker-compose -f docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Проверка здоровья приложения
curl http://localhost/health
```

## 🔐 Настройка SSL сертификатов

### Автоматическая настройка

```bash
# Сделать скрипт исполняемым
chmod +x scripts/setup-ssl.sh

# Запустить настройку SSL
./scripts/setup-ssl.sh
```

### Ручная настройка (если автоматическая не работает)

```bash
# Установка certbot
sudo apt install -y certbot

# Создание директории для вебрута
sudo mkdir -p /var/www/certbot

# Получение сертификатов
sudo certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d yourdomain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown $(whoami):$(whoami) ssl/*.pem

# Перезапуск nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔄 Управление приложением

### Остановка приложения

```bash
docker-compose -f docker-compose.prod.yml down
```

### Запуск приложения

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Обновление приложения

```bash
# Получение обновлений
git pull origin main

# Пересборка и перезапуск
docker-compose -f docker-compose.prod.yml up -d --build
```

### Просмотр логов

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

## 📊 Мониторинг

### Проверка ресурсов

```bash
# Использование диска
df -h

# Использование памяти
free -h

# Статус Docker контейнеров
docker stats
```

### Резервное копирование базы данных

```bash
# Создание бэкапа
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U tada_user tada_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U tada_user tada_production < backup_file.sql
```

## 🛠️ Устранение неполадок

### Проблема: Контейнеры не запускаются

```bash
# Проверка логов
docker-compose -f docker-compose.prod.yml logs

# Проверка свободного места
df -h

# Проверка памяти
free -h
```

### Проблема: SSL не работает

```bash
# Проверка сертификатов
ls -la ssl/

# Проверка nginx конфигурации
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Перезапуск nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Проблема: База данных не подключается

```bash
# Проверка статуса PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U tada_user -d tada_production

# Подключение к базе данных
docker-compose -f docker-compose.prod.yml exec postgres psql -U tada_user -d tada_production
```

## 🔒 Безопасность

### Рекомендации по безопасности

1. **Используйте сильные пароли** для всех сервисов
2. **Регулярно обновляйте** систему и контейнеры
3. **Настройте мониторинг** и алерты
4. **Регулярно делайте бэкапы** базы данных
5. **Ограничьте SSH доступ** только для нужных IP

### Дополнительные меры безопасности

```bash
# Изменение SSH порта
sudo nano /etc/ssh/sshd_config
# Изменить Port 22 на другой порт
sudo systemctl restart sshd

# Обновление правил файрвола
sudo ufw allow новый_порт/tcp
sudo ufw delete allow ssh
```

## 📈 Оптимизация производительности

### Настройка Docker

```bash
# Очистка неиспользуемых Docker объектов
docker system prune -a

# Настройка лимитов памяти в docker-compose.prod.yml
# Добавьте в сервисы:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

### Мониторинг производительности

```bash
# Установка htop
sudo apt install htop

# Мониторинг системы
htop
```

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs -f`
2. Проверьте статус сервисов: `docker-compose -f docker-compose.prod.yml ps`
3. Проверьте системные ресурсы: `htop`, `df -h`
4. Проверьте файрвол: `sudo ufw status`
5. Проверьте SSL сертификаты: `ls -la ssl/`

## 🎉 Готово!

После успешного развертывания ваше приложение будет доступно по адресу: `https://yourdomain.com`

- **Фронтенд:** https://yourdomain.com
- **API:** https://yourdomain.com/api
- **Здоровье:** https://yourdomain.com/health
