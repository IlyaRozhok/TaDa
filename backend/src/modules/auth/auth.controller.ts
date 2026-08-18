import { Controller, Post, UseGuards, Get, Req, Res, UnauthorizedException } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { User } from "@/entities/user.entity";
import { AuthGuard } from "@nestjs/passport";
import { accessTokenTtl, refreshTokenTtl } from "@/common/config/auth-tokens.config";

const isProd = () => process.env.NODE_ENV === "production";

// Each cookie outlives its token by exactly nothing: the `maxAge` comes from the
// same lifetime the token was signed with, so the two can no longer drift apart.
const accessCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax" as const,
  maxAge: accessTokenTtl().ms,
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax" as const,
  maxAge: refreshTokenTtl().ms,
});

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get("me")
  async getProfile(@CurrentUser() user: User) {
    const fullUser = await this.authService.findUserWithProfile(user.id);
    return { user: fullUser };
  }

  // Public by necessity: the caller's access token is expired — that is the
  // reason it is calling. The refresh_token cookie is the credential here, and
  // it is checked below, not by a guard.
  @Post("refresh")
  @Public()
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie("access_token", tokens.accessToken, accessCookieOptions());
    res.cookie("refresh_token", tokens.refreshToken, refreshCookieOptions());

    return { message: "Tokens refreshed successfully" };
  }

  // Logging out must work even with a dead access token, otherwise the cookies
  // that are the problem can never be cleared.
  @Post("logout")
  @Public()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.clearRefreshToken(refreshToken);
    }
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return { message: "Logged out successfully" };
  }

  // --- Google OAuth ---

  // `@Public()` is what lets the Google guard below ever run: without it the
  // global JWT guard rejects the request before the OAuth handshake starts.
  @Get("google")
  @Public()
  @UseGuards(AuthGuard("google"))
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  async googleAuth() {}

  @Get("google/callback")
  @Public()
  @UseGuards(AuthGuard("google"))
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    try {
      if (req.query.error) {
        return res.redirect(`${frontendUrl}/app/auth/callback?error=oauth_error&details=${req.query.error}`);
      }
      if (!req.user) {
        return res.redirect(`${frontendUrl}/app/auth/callback?error=no_user_data`);
      }

      const { user, isNew } = await this.authService.googleAuth(req.user);
      const { accessToken, refreshToken } = await this.authService.generateTokens(user);

      res.cookie("access_token", accessToken, accessCookieOptions());
      res.cookie("refresh_token", refreshToken, refreshCookieOptions());

      // `is_new` distinguishes a registration from a repeat sign-in. Only this
      // request knows: /auth/me answers the same either way, and the frontend
      // needs the difference to report sign_up separately from login.
      const isNewParam = isNew ? "&is_new=1" : "";

      return res.redirect(`${frontendUrl}/app/auth/callback?success=true${isNewParam}`);
    } catch {
      return res.redirect(`${frontendUrl}/app/auth/callback?error=auth_failed`);
    }
  }
}
