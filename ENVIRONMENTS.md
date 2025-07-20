# TaDa Environment Configuration Guide

## Overview

TaDa использует три основные среды разработки:

1. **Local** - для локальной разработки
2. **Test** - тестовая среда на Hetzner VPS
3. **Production** - продакшн среда на AWS (в разработке)

## Environment Setup

### Quick Start

```bash
# Настройка локальной среды
./scripts/env-setup.sh local

# Настройка тестовой среды
./scripts/env-setup.sh test

# Настройка продакшн среды
./scripts/env-setup.sh production
```

## 1. Local Environment

### Конфигурация

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **Database**: PostgreSQL на localhost:5432
- **S3**: LocalStack на localhost:4566

### Запуск

```bash
# С Docker Compose
docker-compose -f docker-compose.local.yml up

# Без Docker
cd backend && npm run start:dev
cd frontend && npm run dev
```

### Особенности

- Hot reload для фронтенда и бэкенда
- LocalStack для тестирования S3
- PgAdmin доступен на http://localhost:5050

## 2. Test Environment

### Конфигурация

- **Frontend**: https://tada.illiacodes.dev
- **Backend API**: https://api.tada.illiacodes.com
- **Database**: PostgreSQL на VPS (95.217.7.37:5433)
- **S3**: AWS S3 (тестовый bucket)

### Деплой

```bash
# Автоматический деплой
./scripts/deploy-test.sh

# Ручной деплой через SSH
ssh root@95.217.7.37
cd /opt/tada
docker-compose -f docker-compose.test.yml up -d
```

### Nginx Configuration

```nginx
server {
    server_name api.tada.illiacodes.dev;
    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 3. Production Environment (AWS)

### Планируемая архитектура

- **Frontend**: CloudFront + S3 / Vercel
- **Backend**: ECS Fargate / EC2
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3
- **Secrets**: AWS Secrets Manager

### Инфраструктура

```
┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│    S3 Static    │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   ALB/API GW    │────▶│   ECS Fargate   │
└─────────────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌─────────────┐           ┌─────────────┐
            │     RDS     │           │  S3 Media   │
            └─────────────┘           └─────────────┘
```

## Environment Variables

### Backend

| Variable    | Local                 | Test                        | Production       |
| ----------- | --------------------- | --------------------------- | ---------------- |
| DB_HOST     | localhost             | 95.217.7.37                 | RDS endpoint     |
| DB_PORT     | 5432                  | 5433                        | 5432             |
| NODE_ENV    | development           | test                        | production       |
| PORT        | 5001                  | 3001                        | 3000             |
| CORS_ORIGIN | http://localhost:3000 | https://tada.illiacodes.dev | https://tada.com |

### Frontend

| Variable                 | Local                     | Test                                | Production               |
| ------------------------ | ------------------------- | ----------------------------------- | ------------------------ |
| NEXT_PUBLIC_API_URL      | http://localhost:5001/api | https://api.tada.illiacodes.com/api | https://api.tada.com/api |
| NEXT_PUBLIC_ENVIRONMENT  | local                     | test                                | production               |
| NEXT_PUBLIC_ENABLE_DEBUG | true                      | true                                | false                    |

## Security Considerations

### Secrets Management

1. **Local**: Используйте `.env` файлы (добавлены в .gitignore)
2. **Test**: Храните секреты в `.env.test` на VPS
3. **Production**: Используйте AWS Secrets Manager

### Пароли и ключи

- Никогда не коммитьте реальные пароли в репозиторий
- Используйте разные JWT секреты для каждой среды
- Регулярно ротируйте ключи доступа

## Monitoring & Logging

### Local

- Консольные логи
- Debug mode включен

### Test

- Логи в Docker контейнерах
- Nginx access/error logs

### Production (планируется)

- CloudWatch Logs
- Sentry для error tracking
- DataDog/New Relic для APM

## Database Migrations

```bash
# Local
cd backend && npm run migration:run

# Test (через SSH)
docker-compose -f docker-compose.test.yml exec backend npm run migration:run

# Production
# Будет выполняться через CI/CD pipeline
```

## Troubleshooting

### Common Issues

1. **CORS ошибки**: Проверьте CORS_ORIGIN в backend .env
2. **База данных недоступна**: Проверьте DB_HOST и DB_PORT
3. **S3 upload не работает**: Проверьте AWS credentials
4. **OAuth redirect**: Убедитесь что GOOGLE_CALLBACK_URL правильный

### Useful Commands

```bash
# Проверка статуса контейнеров (test)
ssh root@95.217.7.37 'docker ps'

# Просмотр логов backend (test)
ssh root@95.217.7.37 'docker logs tada-backend-test -f'

# Перезапуск nginx
ssh root@95.217.7.37 'systemctl restart nginx'

# Проверка SSL сертификатов
certbot certificates
```

## CI/CD Pipeline (TODO)

### GitHub Actions / GitLab CI

```yaml
stages:
  - test
  - build
  - deploy

test:
  script:
    - npm test
    - npm run lint

build:
  script:
    - docker build -t $IMAGE_TAG .
    - docker push $IMAGE_TAG

deploy:
  script:
    - ./scripts/deploy-$CI_ENVIRONMENT_NAME.sh
```

## Backup Strategy

### Database Backups

```bash
# Local backup
pg_dump rental_platform_local > backup_$(date +%Y%m%d).sql

# Test backup
ssh root@95.217.7.37 'docker exec tada-postgres pg_dump -U postgres rental_platform' > backup_test_$(date +%Y%m%d).sql

# Production (AWS RDS)
# Автоматические снапшоты через RDS
```

### Media Files Backup

- Local: Папка uploads/
- Test/Prod: S3 versioning и lifecycle policies
