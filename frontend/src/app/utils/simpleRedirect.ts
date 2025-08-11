// Максимально простая логика редиректа после логина
// Никакого оверинжиниринга, только необходимый минимум

import { isNavigationBlocked } from "./navigationGuard";

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

  console.log(`🔍 Role resolution: "${user.role}" → "${primaryRole}"`);

  // В зависимости от основной роли - на соответствующий дашборд
  switch (primaryRole) {
    case "admin":
      return "/app/dashboard/admin";
    case "operator":
      return "/app/dashboard/operator";
    case "tenant":
      return "/app/dashboard/tenant";
    default:
      console.warn(
        `⚠️ Unknown role "${user.role}", redirecting to role selection`
      );
      return "/?needsRole=true";
  }
}

export function redirectAfterLogin(user: any, router: any) {
  // Check if navigation is blocked
  if (isNavigationBlocked()) {
    console.log(`⛔ Redirect blocked for ${user?.email}`);
    return;
  }

  const path = getRedirectPath(user);
  console.log(`🔄 Simple redirect: ${user?.email} (${user?.role}) → ${path}`);
  router.replace(path);
}
