#!/usr/bin/env ts-node

import { config } from "dotenv";
import { join } from "path";

// Load environment variables
config({ path: join(__dirname, "..", ".env") });

function diagnoseRedirectUriMismatch() {
  console.log("🔍 Диагностика ошибки redirect_uri_mismatch\n");

  // Получаем переменные окружения
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;
  const frontendUrl = process.env.FRONTEND_URL;
  const port = process.env.PORT || "5001";

  console.log("📋 Текущие настройки:");
  console.log(`   GOOGLE_CLIENT_ID: ${googleClientId || "❌ НЕ ЗАДАН"}`);
  console.log(`   GOOGLE_CALLBACK_URL: ${googleCallbackUrl || "❌ НЕ ЗАДАН"}`);
  console.log(`   FRONTEND_URL: ${frontendUrl || "❌ НЕ ЗАДАН"}`);
  console.log(`   PORT: ${port}`);

  // Определяем ожидаемый callback URL
  const expectedCallbackUrl = `http://localhost:${port}/auth/google/callback`;

  console.log("\n🎯 Ожидаемый callback URL:");
  console.log(`   ${expectedCallbackUrl}`);

  // Проверяем совпадение
  if (googleCallbackUrl !== expectedCallbackUrl) {
    console.log("\n❌ ПРОБЛЕМА НАЙДЕНА:");
    console.log(`   Настроенный URL: ${googleCallbackUrl}`);
    console.log(`   Ожидаемый URL:   ${expectedCallbackUrl}`);

    if (!googleCallbackUrl) {
      console.log("\n🔧 РЕШЕНИЕ: Добавьте переменную окружения");
      console.log(`   GOOGLE_CALLBACK_URL=${expectedCallbackUrl}`);
    } else {
      console.log("\n🔧 РЕШЕНИЕ: Обновите переменную окружения");
      console.log(`   GOOGLE_CALLBACK_URL=${expectedCallbackUrl}`);
    }
  } else {
    console.log("\n✅ Переменная окружения настроена правильно");
  }

  console.log("\n📋 Что нужно проверить в Google Cloud Console:");
  console.log("1. Перейдите в Google Cloud Console");
  console.log("2. Откройте ваш проект");
  console.log('3. Перейдите в "APIs & Services" > "Credentials"');
  console.log("4. Найдите ваш OAuth 2.0 Client ID");
  console.log("5. Нажмите на него для редактирования");
  console.log('6. В разделе "Authorized redirect URIs" должен быть:');
  console.log(`   ${expectedCallbackUrl}`);

  console.log("\n🔧 Пошаговое исправление:");
  console.log("1. В Google Cloud Console:");
  console.log("   - Удалите все неправильные redirect URIs");
  console.log(`   - Добавьте: ${expectedCallbackUrl}`);
  console.log('   - Нажмите "Save"');
  console.log("");
  console.log("2. В файле backend/.env:");
  console.log(`   GOOGLE_CALLBACK_URL=${expectedCallbackUrl}`);
  console.log("");
  console.log("3. Перезапустите backend сервер");
  console.log("4. Попробуйте снова: http://localhost:5001/auth/google");

  // Проверяем общие ошибки
  console.log("\n⚠️  Частые ошибки:");

  if (
    googleCallbackUrl?.includes("https://") &&
    googleCallbackUrl?.includes("localhost")
  ) {
    console.log("   ❌ Используется HTTPS с localhost (должно быть HTTP)");
  }

  if (googleCallbackUrl?.includes("3000")) {
    console.log("   ❌ Используется порт 3000 (должен быть 5001 для backend)");
  }

  if (googleCallbackUrl?.includes("frontend")) {
    console.log(
      "   ❌ Callback URL указывает на frontend (должен быть backend)"
    );
  }

  if (!googleCallbackUrl?.includes("/auth/google/callback")) {
    console.log(
      "   ❌ Неправильный путь callback (должен быть /auth/google/callback)"
    );
  }

  console.log("\n📱 Дополнительные проверки:");
  console.log("1. Проверьте, что backend запущен на порту 5001");
  console.log(
    "2. Проверьте, что в Google Cloud Console включен правильный проект"
  );
  console.log("3. Убедитесь, что OAuth consent screen настроен");
  console.log("4. Проверьте, что Client ID и Secret скопированы правильно");

  console.log("\n🧪 Тест URL:");
  console.log(
    `curl -I "${expectedCallbackUrl.replace("/auth/google/callback", "/auth/google")}"`
  );

  return {
    currentCallbackUrl: googleCallbackUrl,
    expectedCallbackUrl,
    isCorrect: googleCallbackUrl === expectedCallbackUrl,
  };
}

async function testCurrentEndpoint() {
  console.log("\n🔍 Тестирование текущего эндпоинта...");

  const port = process.env.PORT || "5001";
  const testUrl = `http://localhost:${port}/auth/google`;

  try {
    const response = await fetch(testUrl, {
      method: "GET",
      redirect: "manual",
    });

    console.log(`📡 Статус ответа: ${response.status}`);

    if (response.status === 302) {
      const location = response.headers.get("location");
      console.log(`🔄 Redirect на: ${location}`);

      if (location?.includes("accounts.google.com")) {
        console.log("✅ Redirect на Google работает");

        // Извлекаем redirect_uri из URL
        const url = new URL(location);
        const redirectUri = url.searchParams.get("redirect_uri");
        console.log(`🎯 Фактический redirect_uri: ${redirectUri}`);

        return redirectUri;
      } else {
        console.log("❌ Redirect не на Google");
      }
    } else {
      console.log("❌ Неожиданный статус ответа");
    }
  } catch (error) {
    console.log("❌ Ошибка при тестировании:", error.message);
    console.log("   Убедитесь, что backend запущен");
  }

  return null;
}

async function main() {
  const diagnosis = diagnoseRedirectUriMismatch();

  if (diagnosis.isCorrect) {
    const actualRedirectUri = await testCurrentEndpoint();

    if (actualRedirectUri) {
      console.log("\n📊 Сравнение:");
      console.log(`   Настроенный: ${diagnosis.currentCallbackUrl}`);
      console.log(`   Фактический: ${actualRedirectUri}`);

      if (diagnosis.currentCallbackUrl === actualRedirectUri) {
        console.log(
          "✅ URLs совпадают - проблема может быть в Google Cloud Console"
        );
      } else {
        console.log("❌ URLs НЕ совпадают - проблема в конфигурации");
      }
    }
  }

  console.log("\n🔗 Полезные ссылки:");
  console.log("   Google Cloud Console: https://console.cloud.google.com/");
  console.log(
    "   OAuth 2.0 Playground: https://developers.google.com/oauthplayground/"
  );
  console.log(
    "   Документация: https://developers.google.com/identity/protocols/oauth2"
  );
}

if (require.main === module) {
  main();
}
