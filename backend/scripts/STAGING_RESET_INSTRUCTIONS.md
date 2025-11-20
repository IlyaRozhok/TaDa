# Инструкция по обновлению Staging базы данных

## ⚠️ ВНИМАНИЕ
Этот процесс **полностью удалит все данные** из staging базы данных и создаст новую структуру с нуля.

## Подготовка

1. **Убедитесь, что у вас есть доступ к staging базе данных**
   - Проверьте переменные окружения для staging
   - Убедитесь, что у вас есть права на удаление и создание таблиц

2. **Проверьте, что все миграции актуальны**
   ```bash
   cd backend
   npm run build
   ```

3. **Убедитесь, что staging сервер доступен** (для seed скрипта)
   - URL должен быть: `https://stage.ta-da.co/api`

## Процесс обновления

### Вариант 1: Полный сброс с автоматическим seed

```bash
cd backend

# Установите переменные окружения для staging
export NODE_ENV=stage
export DB_HOST=<staging_db_host>
export DB_PORT=5432
export DB_USERNAME=<staging_db_user>
export DB_PASSWORD=<staging_db_password>
export DB_NAME=<staging_db_name>

# Запустите полный сброс с seed
npm run db:reset:seed
```

### Вариант 2: Полный сброс без seed

```bash
cd backend

# Установите переменные окружения для staging
export NODE_ENV=stage
export DB_HOST=<staging_db_host>
export DB_PORT=5432
export DB_USERNAME=<staging_db_user>
export DB_PASSWORD=<staging_db_password>
export DB_NAME=<staging_db_name>

# Запустите полный сброс
npm run db:reset

# Затем вручную запустите seed (если нужно)
node scripts/seed-staging.js
```

### Вариант 3: Использование .env файла

Создайте файл `.env.staging` в директории `backend/`:

```env
NODE_ENV=stage
DB_HOST=<staging_db_host>
DB_PORT=5432
DB_USERNAME=<staging_db_user>
DB_PASSWORD=<staging_db_password>
DB_NAME=<staging_db_name>
```

Затем:

```bash
cd backend
source .env.staging
npm run db:reset:seed
```

## Что делает скрипт

1. **Подключение к базе данных** - проверяет доступность
2. **Удаление всех таблиц** - полностью очищает базу:
   - Удаляет все foreign key constraints
   - Удаляет все таблицы
   - Удаляет все enum типы
   - Удаляет все sequences
3. **Применение миграций** - запускает все миграции с нуля:
   - `1756000000000-InitialSchema.ts`
   - `1756000000001-FixSchemaIssues.ts`
   - `1756000000002-FixAdditionalIssues.ts`
   - `1756000000003-FixPropertyTypeSchema.ts`
   - `1756000000004-CleanupUserProfiles.ts`
   - `1756000000005-CreateResidentialComplexes.ts`
   - `1756000000006-RefactorResidentialComplexesToBuildings.ts`
   - `1756000000007-AddAmenitiesToBuildings.ts`
   - `1756000000008-MakeBuildingFieldsOptional.ts`
4. **Заполнение тестовыми данными** (если используется `--seed`):
   - Создает 5 операторов
   - Создает 20 свойств (4 на каждого оператора)
   - Добавляет изображения к каждому свойству

## Проверка после обновления

1. **Проверьте структуру базы данных:**
   ```sql
   \dt  -- список таблиц
   SELECT * FROM migrations;  -- список примененных миграций
   ```

2. **Проверьте данные:**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM properties;
   SELECT COUNT(*) FROM buildings;
   ```

3. **Проверьте API:**
   - Откройте `https://stage.ta-da.co/api/docs`
   - Попробуйте залогиниться как один из операторов:
     - `staging-operator1@tada.com` / `StagingPass123!`
     - `staging-operator2@tada.com` / `StagingPass123!`
     - и т.д.

## Troubleshooting

### Ошибка подключения к базе данных
- Проверьте переменные окружения
- Убедитесь, что база данных доступна
- Проверьте firewall правила

### Ошибка при применении миграций
- Убедитесь, что проект собран: `npm run build`
- Проверьте, что все миграции корректны
- Проверьте логи для деталей

### Ошибка при seed
- Убедитесь, что staging сервер запущен и доступен
- Проверьте URL в `seed-staging.js`
- Проверьте, что API endpoints работают

### Пропуск подтверждения
Если нужно запустить без 5-секундной задержки:
```bash
SKIP_CONFIRMATION=true npm run db:reset:seed
```

## Откат изменений

⚠️ **ВНИМАНИЕ**: После выполнения скрипта откат невозможен без бэкапа!

Если у вас есть бэкап базы данных, вы можете восстановить его:
```bash
pg_restore -h <host> -U <user> -d <database> <backup_file>
```

## Дополнительные команды

- **Только применить миграции** (без очистки):
  ```bash
  npm run migration:run:prod
  ```

- **Откатить последнюю миграцию**:
  ```bash
  npm run migration:revert:prod
  ```

- **Проверить статус миграций**:
  ```sql
  SELECT * FROM migrations ORDER BY timestamp DESC;
  ```

