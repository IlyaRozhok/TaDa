import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Проверяем, есть ли у пользователя хотя бы одна из требуемых ролей
    // Поддерживаем как новый формат (role), так и старый (roles). Сравниваем как строки (enum/string).
    const userRoleStr = user.role != null ? String(user.role) : "";
    const hasRequiredRole = requiredRoles.some(
      (r) => String(r) === userRoleStr,
    );
    if (hasRequiredRole) {
      return true;
    }
    if (Array.isArray(user.roles)) {
      const hasRole = requiredRoles.some((role) =>
        user.roles.some((ur) => String(ur) === String(role)),
      );
      return hasRole;
    }

    return false;
  }
}
