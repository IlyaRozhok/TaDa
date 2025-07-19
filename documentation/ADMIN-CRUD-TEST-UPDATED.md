# 🧪 Тестирование CRUD операций в админке

## ✅ Что исправлено

### 1. **Backend API для пользователей**

- ✅ Исправлен `adminUpdateUser` - теперь правильно обрабатывает phone из профилей
- ✅ Обновлен `findOne` - возвращает phone из соответствующих профилей
- ✅ Обновлен `findAllPaginated` - включает phone в результаты
- ✅ Правильное создание профилей при смене роли

### 2. **Frontend админки**

- ✅ Созданы отдельные формы для Users, Properties, Preferences
- ✅ Исправлены React hook ошибки
- ✅ Правильная условная отрисовка модальных окон
- ✅ Валидация форм для каждого типа данных

### 3. **Проблемы решены**

- ✅ Таблицы Properties и Preferences теперь имеют свои собственные формы
- ✅ Обновление пользователей работает с phone и ролями
- ✅ Смена роли создает соответствующие профили
- ✅ Удаление пользователей работает с каскадным удалением

## 🧪 Как протестировать

### Этап 1: Запуск приложения

```bash
# Backend
cd backend
npm run dev

# Frontend (в новом терминале)
cd frontend
npm run dev
```

### Этап 2: Вход в админку

1. Перейдите в приложение: `http://localhost:3000`
2. Войдите как админ пользователь
3. Перейдите в Admin Dashboard: `/app/dashboard/admin`
4. Нажмите "Admin Panel" для доступа к управлению: `/app/admin/panel`

### Этап 3: Тестирование Users

#### ✅ Создание пользователя

1. Нажмите "Add User" в разделе Users
2. Заполните форму:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Phone: "+44 123 456 7890"
   - Role: "tenant"
3. Нажмите "Create User"
4. ✅ Проверьте, что пользователь создался с phone

#### ✅ Обновление пользователя

1. Нажмите на иконку "Edit" у пользователя
2. Измените:
   - Full Name: "Updated Test User"
   - Phone: "+44 999 888 7777"
   - Role: "operator"
3. Нажмите "Update User"
4. ✅ Проверьте, что все поля сохранились, включая phone
5. ✅ Проверьте, что создался operator profile

#### ✅ Просмотр пользователя

1. Нажмите на иконку "View" у пользователя
2. ✅ Проверьте, что отображается phone из профиля
3. ✅ Проверьте, что все поля показаны правильно

#### ✅ Удаление пользователя

1. Нажмите на иконку "Delete" у пользователя
2. Подтвердите удаление
3. ✅ Проверьте, что пользователь удален со всеми связанными данными

### Этап 4: Тестирование Properties

#### ✅ Создание недвижимости

1. Переключитесь на раздел "Properties"
2. Нажмите "Add Property"
3. Заполните форму:
   - Title: "Test Property"
   - Description: "Test Description"
   - Address: "123 Test Street"
   - Price: 2000
   - Bedrooms: 2
   - Bathrooms: 1
   - Property Type: "apartment"
   - Furnishing: "furnished"
4. Нажмите "Create Property"
5. ✅ Проверьте, что недвижимость создалась

#### ✅ Редактирование недвижимости

1. Нажмите на иконку "Edit" у недвижимости
2. Измените:
   - Title: "Updated Property"
   - Price: 2500
   - Bedrooms: 3
3. Нажмите "Update Property"
4. ✅ Проверьте, что изменения сохранились

#### ✅ Удаление недвижимости

1. Нажмите на иконку "Delete" у недвижимости
2. Подтвердите удаление
3. ✅ Проверьте, что недвижимость удалена

### Этап 5: Тестирование Preferences

#### ✅ Просмотр предпочтений

1. Переключитесь на раздел "Preferences"
2. ✅ Проверьте, что отображаются существующие предпочтения
3. ✅ Проверьте, что показывается информация о пользователе

#### ✅ Редактирование предпочтений

1. Нажмите на иконку "Edit" у предпочтений
2. Измените:
   - Min Price: 1500
   - Max Price: 3000
   - Min Bedrooms: 2
   - Max Bedrooms: 4
3. Нажмите "Update Preferences"
4. ✅ Проверьте, что изменения сохранились

#### ✅ Удаление предпочтений

1. Нажмите на иконку "Delete" у предпочтений
2. Подтвердите удаление
3. ✅ Проверьте, что предпочтения удалены

### Этап 6: Тестирование поиска и фильтрации

#### ✅ Поиск пользователей

1. В разделе Users используйте поле поиска
2. Введите имя или email пользователя
3. ✅ Проверьте, что результаты фильтруются правильно

#### ✅ Фильтрация по ролям

1. Используйте dropdown "All Roles"
2. Выберите "Admin", "Operator", или "Tenant"
3. ✅ Проверьте, что отображаются только пользователи выбранной роли

#### ✅ Сортировка

1. Нажмите на заголовки столбцов для сортировки
2. ✅ Проверьте, что данные сортируются правильно

#### ✅ Пагинация

1. Измените количество элементов на странице
2. Переключайтесь между страницами
3. ✅ Проверьте, что пагинация работает корректно

## 🔧 Автоматизированный тест

Откройте консоль браузера (F12) и запустите:

```javascript
// Тест для Users API
const testUsersAPI = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const token = localStorage.getItem("accessToken");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  console.log("🧪 Testing Users CRUD...");

  try {
    // Test Create
    const createResponse = await fetch(`${apiUrl}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        full_name: "API Test User",
        email: "apitest@example.com",
        password: "testpass123",
        role: "tenant",
        phone: "+44 123 456 7890",
      }),
    });

    if (createResponse.ok) {
      const user = await createResponse.json();
      console.log("✅ Create user:", user);

      // Test Update
      const updateResponse = await fetch(`${apiUrl}/users/${user.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          full_name: "Updated API Test User",
          phone: "+44 999 888 7777",
          role: "operator",
        }),
      });

      if (updateResponse.ok) {
        const updatedUser = await updateResponse.json();
        console.log("✅ Update user:", updatedUser);

        // Test Get
        const getResponse = await fetch(`${apiUrl}/users?page=1&limit=10`, {
          headers,
        });

        if (getResponse.ok) {
          const users = await getResponse.json();
          console.log("✅ Get users:", users.total, "users found");

          // Test Delete
          const deleteResponse = await fetch(`${apiUrl}/users/${user.id}`, {
            method: "DELETE",
            headers,
          });

          if (deleteResponse.ok) {
            console.log("✅ Delete user: Success");
            console.log("🎉 All Users CRUD tests passed!");
          } else {
            console.error("❌ Delete user failed");
          }
        } else {
          console.error("❌ Get users failed");
        }
      } else {
        console.error("❌ Update user failed");
      }
    } else {
      console.error("❌ Create user failed");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Запустить тест
testUsersAPI();
```

## 📋 Чек-лист для тестирования

### Users Management

- [ ] Создание пользователя с phone
- [ ] Обновление пользователя с phone
- [ ] Смена роли создает профиль
- [ ] Просмотр пользователя показывает phone
- [ ] Удаление пользователя работает
- [ ] Поиск по имени/email
- [ ] Фильтрация по роли
- [ ] Сортировка по полям
- [ ] Пагинация

### Properties Management

- [ ] Создание недвижимости
- [ ] Редактирование недвижимости
- [ ] Удаление недвижимости
- [ ] Просмотр недвижимости
- [ ] Поиск недвижимости
- [ ] Сортировка по полям
- [ ] Пагинация

### Preferences Management

- [ ] Просмотр предпочтений
- [ ] Редактирование предпочтений
- [ ] Удаление предпочтений
- [ ] Поиск предпочтений
- [ ] Сортировка по полям
- [ ] Пагинация

### UI/UX

- [ ] Модальные окна открываются правильно
- [ ] Формы валидируются
- [ ] Загрузка показывается
- [ ] Ошибки отображаются
- [ ] Успешные операции видны

## 🎯 Ожидаемые результаты

### ✅ Что должно работать:

1. **CRUD для Users** - полная функциональность с phone и ролями
2. **CRUD для Properties** - полная функциональность с отдельными формами
3. **CRUD для Preferences** - полная функциональность с отдельными формами
4. **Поиск и фильтрация** - работает для всех разделов
5. **Пагинация** - работает корректно
6. **Валидация** - формы проверяют данные
7. **Отзывчивость** - интерфейс реагирует на действия

### ❌ Что может не работать:

1. Некоторые edge cases с валидацией
2. Сложные фильтры
3. Массовые операции

## 🔧 Решение проблем

### Проблема: "No authentication token"

**Решение**: Убедитесь, что вы залогинены как админ

### Проблема: "Failed to fetch"

**Решение**: Проверьте, что backend запущен на порту 5001

### Проблема: "Permission denied"

**Решение**: Убедитесь, что у пользователя есть роль admin

### Проблема: Форма не отправляется

**Решение**: Проверьте валидацию полей и console.log для ошибок

## 🎉 Заключение

Админка теперь полностью функциональна с:

- ✅ Отдельными формами для каждого типа данных
- ✅ Правильным управлением пользователями с профилями
- ✅ Рабочим CRUD для всех разделов
- ✅ Поиском, фильтрацией и пагинацией
- ✅ Валидацией и обработкой ошибок

Все основные проблемы исправлены и функциональность готова к использованию!
