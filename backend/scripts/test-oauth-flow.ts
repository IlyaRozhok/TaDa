#!/usr/bin/env ts-node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { User } from "../src/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";

async function testOAuthFlow() {
  console.log("🔍 Тестирование Google OAuth flow");

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const jwtService = app.get(JwtService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  // Симулируем Google OAuth пользователя
  const uniqueEmail = `test-oauth-${Date.now()}@example.com`;
  const mockGoogleUser = {
    google_id: "test-google-id-123",
    email: uniqueEmail,
    full_name: "Test User",
    avatar_url: "https://example.com/avatar.jpg",
    provider: "google",
    email_verified: true,
  };

  try {
    console.log("🔍 Шаг 1: Тестирование googleAuth метода...");

    // Вызываем googleAuth
    const authResponse = await authService.googleAuth(mockGoogleUser);

    console.log("✅ GoogleAuth успешно:", {
      hasToken: !!authResponse.access_token,
      tokenLength: authResponse.access_token.length,
      userId: authResponse.user.id,
      userEmail: authResponse.user.email,
      userRole: authResponse.user.role,
    });

    console.log("🔍 Шаг 2: Проверка токена...");

    // Декодируем токен
    const decodedToken = jwtService.decode(authResponse.access_token) as any;
    console.log("📋 Декодированный токен:", {
      sub: decodedToken.sub,
      email: decodedToken.email,
      roles: decodedToken.roles,
      exp: decodedToken.exp
        ? new Date(decodedToken.exp * 1000).toISOString()
        : undefined,
    });

    console.log("🔍 Шаг 3: Проверка пользователя в базе...");

    // Проверяем, что пользователь есть в базе
    const userInDb = await userRepository.findOne({
      where: { id: authResponse.user.id },
      relations: ["tenantProfile", "operatorProfile", "preferences"],
    });

    if (!userInDb) {
      console.error("❌ Пользователь не найден в базе данных");
      return;
    }

    console.log("✅ Пользователь найден в базе:", {
      id: userInDb.id,
      email: userInDb.email,
      role: userInDb.role,
      status: userInDb.status,
      provider: userInDb.provider,
      google_id: userInDb.google_id,
      hasTenantProfile: !!userInDb.tenantProfile,
      hasPreferences: !!userInDb.preferences,
    });

    console.log("🔍 Шаг 4: Тестирование JWT валидации...");

    // Проверяем JWT валидацию
    try {
      const payload = jwtService.verify(authResponse.access_token);
      console.log("✅ JWT токен валиден:", {
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
      });
    } catch (error) {
      console.error("❌ JWT токен невалиден:", error.message);
      return;
    }

    console.log("🔍 Шаг 5: Тестирование поиска пользователя по JWT payload...");

    // Симулируем поиск пользователя как в JWT Strategy
    const jwtUser = await userRepository.findOne({
      where: { id: decodedToken.sub },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
    });

    if (!jwtUser) {
      console.error("❌ Пользователь не найден по JWT payload");
      return;
    }

    console.log("✅ Пользователь найден по JWT payload:", {
      id: jwtUser.id,
      email: jwtUser.email,
      role: jwtUser.role,
      roles: jwtUser.roles,
      hasTenantProfile: !!jwtUser.tenantProfile,
      hasPreferences: !!jwtUser.preferences,
    });

    console.log("🎉 Все тесты прошли успешно!");
  } catch (error) {
    console.error("❌ Ошибка в тестировании OAuth flow:", {
      message: error.message,
      stack: error.stack,
    });
  } finally {
    // Очищаем тестовые данные
    try {
      await userRepository.delete({ email: uniqueEmail });
      console.log("🧹 Тестовые данные очищены");
    } catch (cleanupError) {
      console.warn(
        "⚠️ Ошибка при очистке тестовых данных:",
        cleanupError.message
      );
    }
  }

  await app.close();
}

testOAuthFlow().catch(console.error);
