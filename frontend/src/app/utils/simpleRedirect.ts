// Максимально простая логика редиректа после логина
// Никакого оверинжиниринга, только необходимый минимум

import { isNavigationBlocked } from "./navigationGuard";
import { preferencesAPI } from "../lib/api";

// Простая функция для определения роли пользователя
export function getUserRole(user: any): string {
  if (!user) return "unknown";
  return user.role || "unknown";
}

// Функция для определения основной роли из множественных ролей
export function getPrimaryRole(user: any): string {
  if (!user || !user.role) return "unknown";

  const role = user.role.toString();

  // Если роль содержит admin - это админ
  if (role.includes("admin")) {
    return "admin";
  }

  // Если роль содержит operator - это оператор
  if (role.includes("operator")) {
    return "operator";
  }

  // Если роль содержит tenant - это арендатор
  if (role.includes("tenant")) {
    return "tenant";
  }

  // Если роль точно совпадает с одной из ролей
  if (role === "admin" || role === "operator" || role === "tenant") {
    return role;
  }

  return "unknown";
}

export function getRedirectPath(user: any): string {
  // Если нет пользователя - на главную
  if (!user) {
    return "/";
  }

  // Если нет роли - выбрать роль
  if (!user.role) {
    return "/?needsRole=true";
  }

  // Определяем основную роль (с поддержкой множественных ролей)
  const primaryRole = getPrimaryRole(user);

  // В зависимости от основной роли - на соответствующий дашборд
  switch (primaryRole) {
    case "admin":
      return "/app/admin/panel";
    case "operator":
      return "/app/dashboard/operator";
    case "tenant":
      return "/app/tenant-cv";
    default:
      console.warn(
        `⚠️ Unknown role "${user.role}", redirecting to role selection`,
      );
      return "/?needsRole=true";
  }
}

export async function redirectAfterLogin(user: any, router: any) {
  // Check if navigation is blocked
  if (isNavigationBlocked()) {
    console.log(`⛔ Redirect blocked for ${user?.email}`);
    return;
  }

  // For tenant users, check if they have preferences
  // If not, redirect to onboarding
  if (user?.role === "tenant") {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const response = await preferencesAPI.get();
        if (!response.data || !response.data.id) {
          // No preferences found - redirect to onboarding
          console.log(`🔄 New tenant user, redirecting to onboarding`);
          router.replace("/app/onboarding");
          return;
        }
      }
    } catch (error: any) {
      // 404 means no preferences - redirect to onboarding
      if (error.response?.status === 404) {
        console.log(
          `🔄 New tenant user (no preferences), redirecting to onboarding`,
        );
        router.replace("/app/onboarding");
        return;
      }
      // Other errors - continue with normal redirect
      console.warn("⚠️ Error checking preferences:", error);
    }
  }

  const path = getRedirectPath(user);
  console.log(`🔄 Simple redirect: ${user?.email} (${user?.role}) → ${path}`);
  console.log(`🔍 User details:`, {
    email: user?.email,
    role: user?.role,
    id: user?.id,
    provider: user?.provider,
  });
  router.replace(path);
}
