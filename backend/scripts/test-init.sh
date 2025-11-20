#!/bin/bash

# 🧪 Скрипт для тестирования инициализации базы данных в production-подобных условиях
#
# Этот скрипт:
# 1. Останавливает и удаляет существующие тестовые контейнеры
# 2. Запускает новый PostgreSQL контейнер с init скриптом
# 3. Запускает backend контейнер с автоматическими миграциями
# 4. Запускает тесты инициализации
# 5. Показывает логи и результаты

set -e

echo "🧪 Тестирование инициализации базы данных для production"
echo "=========================================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose не найден. Установите Docker Compose.${NC}"
    exit 1
fi

# Переход в корневую директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}📦 Остановка и удаление существующих тестовых контейнеров...${NC}"
docker-compose -f docker-compose.test-prod.yml down -v 2>/dev/null || true

echo ""
echo -e "${YELLOW}🔨 Сборка backend образа...${NC}"
cd backend
npm run build
cd ..

echo ""
echo -e "${YELLOW}🚀 Запуск тестовых контейнеров...${NC}"
docker-compose -f docker-compose.test-prod.yml up -d postgres-test

echo ""
echo -e "${YELLOW}⏳ Ожидание готовности базы данных (30 секунд)...${NC}"
sleep 30

# Проверка готовности базы данных
echo -e "${YELLOW}🔍 Проверка подключения к базе данных...${NC}"
for i in {1..30}; do
    if docker-compose -f docker-compose.test-prod.yml exec -T postgres-test pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ База данных готова${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ База данных не готова после 30 попыток${NC}"
        docker-compose -f docker-compose.test-prod.yml logs postgres-test
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${YELLOW}🚀 Запуск backend контейнера...${NC}"
docker-compose -f docker-compose.test-prod.yml up -d backend-test-prod

echo ""
echo -e "${YELLOW}⏳ Ожидание запуска backend и выполнения миграций (60 секунд)...${NC}"
sleep 60

echo ""
echo -e "${YELLOW}📋 Логи backend (последние 50 строк):${NC}"
docker-compose -f docker-compose.test-prod.yml logs --tail=50 backend-test-prod

echo ""
echo -e "${YELLOW}🧪 Запуск тестов инициализации...${NC}"
echo ""

# Запуск тестового скрипта
cd backend
node scripts/test-db-init.js --host=localhost --port=5433

TEST_RESULT=$?

echo ""
echo "=========================================================="
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Все тесты пройдены успешно!${NC}"
    echo ""
    echo "База данных готова к production развертыванию на AWS."
    echo ""
    echo "Для проверки подключения к базе данных:"
    echo "  docker-compose -f docker-compose.test-prod.yml exec postgres-test psql -U postgres -d rental_platform"
    echo ""
    echo "Для просмотра логов:"
    echo "  docker-compose -f docker-compose.test-prod.yml logs -f backend-test-prod"
else
    echo -e "${RED}❌ Некоторые тесты не прошли${NC}"
    echo ""
    echo "Проверьте логи выше для деталей."
fi

echo ""
echo "Для остановки тестовых контейнеров:"
echo "  docker-compose -f docker-compose.test-prod.yml down -v"

exit $TEST_RESULT


