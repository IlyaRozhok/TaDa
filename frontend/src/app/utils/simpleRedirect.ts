// Максимально простая логика редиректа после логина
// Никакого оверинжиниринга, только необходимый минимум

// Простая функция для определения роли пользователя
export function getUserRole(user: any): string {
  if (!user) return "unknown";
  return user.role || "unknown";
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

  // В зависимости от роли - на соответствующий дашборд
  switch (user.role) {
    case "admin":
      return "/app/admin/panel";
    case "operator":
      return "/app/dashboard/operator";
    case "tenant":
      return "/app/dashboard/tenant";
    default:
      return "/app/dashboard";
  }
}

export function redirectAfterLogin(user: any, router: any) {
  const path = getRedirectPath(user);
  console.log(`🔄 Simple redirect: ${user?.email} → ${path}`);
  router.replace(path);
}
