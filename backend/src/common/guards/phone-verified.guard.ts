import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ALLOW_UNVERIFIED_PHONE_KEY } from "@/common/decorators/allow-unverified-phone.decorator";
import { IS_PUBLIC_KEY } from "@/common/decorators/public.decorator";
import { phoneVerificationRequired } from "@/modules/phone-verification/phone-verification.config";
import { PhoneVerificationErrors } from "@/modules/phone-verification/phone-verification.errors";

/**
 * The server half of the mandatory verification gate. Off unless
 * PHONE_VERIFICATION_REQUIRED=true; then a signed-in user without
 * `phone_verified_at` gets 403 PHONE_VERIFICATION_REQUIRED everywhere except
 * public routes and those marked @AllowUnverifiedPhone — so skipping the
 * screen in the browser reaches nothing.
 *
 * Runs after the JWT guard (APP_GUARD order), so `request.user` is the full
 * row JwtStrategy loaded on this request: verifying takes effect on the very
 * next call, with no token refresh.
 */
@Injectable()
export class PhoneVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (!phoneVerificationRequired()) return true;

    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
    if (this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_PHONE_KEY, targets)) return true;

    const { user } = context.switchToHttp().getRequest();
    // No user is the JWT guard's business, not this one's.
    if (!user || user.phone_verified_at) return true;

    throw PhoneVerificationErrors.verificationRequired();
  }
}
