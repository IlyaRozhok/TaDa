import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "@/common/decorators/public.decorator";

/**
 * Mounted globally as an APP_GUARD, so every route requires a valid JWT unless
 * it is marked with `@Public()`. The failure direction is deliberate: a route
 * added without any decorator comes out protected, not anonymous.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {

    if (err || !user) {
      if (info && info.message === "No token found") {
        throw new UnauthorizedException("No token found");
      }
      throw err || new UnauthorizedException("Invalid token");
    }

    return user;
  }
}
