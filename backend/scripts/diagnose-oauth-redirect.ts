#!/usr/bin/env ts-node

import { config } from "dotenv";
import { join } from "path";

// Load environment variables
config({ path: join(__dirname, "..", ".env") });

function diagnoseOAuthRedirect() {
  console.log("🔍 OAuth Redirect Configuration Diagnosis");
  console.log("=".repeat(50));

  // Current environment variables
  const nodeEnv = process.env.NODE_ENV || "development";
  const frontendUrl = process.env.FRONTEND_URL;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

  console.log("\n📋 Current Environment:");
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   FRONTEND_URL: ${frontendUrl || "❌ НЕ ЗАДАН"}`);
  console.log(`   BACKEND_URL: ${backendUrl}`);
  console.log(
    `   GOOGLE_CLIENT_ID: ${googleClientId ? "✅ ЗАДАН" : "❌ НЕ ЗАДАН"}`
  );
  console.log(
    `   GOOGLE_CLIENT_SECRET: ${googleClientSecret ? "✅ ЗАДАН" : "❌ НЕ ЗАДАН"}`
  );
  console.log(`   GOOGLE_CALLBACK_URL: ${googleCallbackUrl || "❌ НЕ ЗАДАН"}`);

  console.log("\n🔧 Required Configuration:");

  if (nodeEnv === "production") {
    console.log("   Production Environment Detected");
    console.log("   Ensure these environment variables are set:");
    console.log(`   FRONTEND_URL=https://tada.illiacodes.dev`);
    console.log(`   BACKEND_URL=https://tada.illiacodes.dev`);
    console.log(
      `   GOOGLE_CALLBACK_URL=https://tada.illiacodes.dev/api/auth/google/callback`
    );

    console.log("\n🌐 Google Cloud Console Configuration:");
    console.log(
      "   Go to Google Cloud Console > APIs & Services > Credentials"
    );
    console.log(
      "   Update your OAuth 2.0 Client ID with these Authorized redirect URIs:"
    );
    console.log(`   ✅ https://tada.illiacodes.dev/api/auth/google/callback`);

    console.log("\n🔍 Testing URLs:");
    console.log(
      "   OAuth initiation: https://tada.illiacodes.dev/api/auth/google"
    );
    console.log(
      "   OAuth callback: https://tada.illiacodes.dev/api/auth/google/callback"
    );
  } else {
    console.log("   Development Environment");
    console.log("   Ensure these environment variables are set:");
    console.log(`   FRONTEND_URL=http://localhost:3000`);
    console.log(`   BACKEND_URL=http://localhost:5001`);
    console.log(
      `   GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback`
    );

    console.log("\n🌐 Google Cloud Console Configuration:");
    console.log(
      "   Go to Google Cloud Console > APIs & Services > Credentials"
    );
    console.log(
      "   Update your OAuth 2.0 Client ID with these Authorized redirect URIs:"
    );
    console.log(`   ✅ http://localhost:5001/api/auth/google/callback`);

    console.log("\n🔍 Testing URLs:");
    console.log("   OAuth initiation: http://localhost:5001/api/auth/google");
    console.log(
      "   OAuth callback: http://localhost:5001/api/auth/google/callback"
    );
  }

  console.log("\n⚠️  Important Notes:");
  console.log(
    "   1. All routes now have '/api' prefix due to global prefix configuration"
  );
  console.log("   2. Google Cloud Console redirect URIs must match exactly");
  console.log(
    "   3. After updating environment variables, restart the backend server"
  );
  console.log("   4. Test the OAuth flow after making changes");

  console.log("\n🚨 Current Issues:");
  const issues = [];

  if (!googleClientId) {
    issues.push("❌ GOOGLE_CLIENT_ID is not set");
  }
  if (!googleClientSecret) {
    issues.push("❌ GOOGLE_CLIENT_SECRET is not set");
  }
  if (!googleCallbackUrl) {
    issues.push("❌ GOOGLE_CALLBACK_URL is not set");
  } else if (!googleCallbackUrl.includes("/api/auth/google/callback")) {
    issues.push("❌ GOOGLE_CALLBACK_URL should include '/api' prefix");
  }
  if (!frontendUrl && nodeEnv === "production") {
    issues.push("❌ FRONTEND_URL is not set for production");
  }

  if (issues.length > 0) {
    issues.forEach((issue) => console.log(`   ${issue}`));
  } else {
    console.log("   ✅ All configuration looks correct!");
  }

  console.log("\n" + "=".repeat(50));
}

diagnoseOAuthRedirect();

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
  // OAuth diagnosis has already been run
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
