import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Attaches `req.user` when a valid access token is present and passes
 * anonymous requests through with no user instead of a 401.
 *
 * For @Public() routes whose RESPONSE depends on being signed in (the tenant
 * CV share link masks contact details for anonymous viewers). Reuses the
 * "jwt" passport strategy, so token parsing, the active-status check and the
 * cookie/header extraction stay identical to the real guard — only the
 * failure mode differs.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser | null {
    return user || null;
  }
}
