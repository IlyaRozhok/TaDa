import { Controller, Post, UseGuards, Get, Req, Res, UnauthorizedException } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService, GoogleUser } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";
import { AuthGuard } from "@nestjs/passport";

const isProd = () => process.env.NODE_ENV === "production";

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax" as const,
  maxAge: 15 * 60 * 1000,
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    const fullUser = await this.authService.findUserWithProfile(user.id);
    return { user: fullUser };
  }

  @Post("refresh")
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

  @Post("logout")
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

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  async googleAuth() {}

  @Get("google/callback")
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

      const user = await this.authService.googleAuth(req.user as GoogleUser);
      const { accessToken, refreshToken } = await this.authService.generateTokens(user);

      res.cookie("access_token", accessToken, accessCookieOptions());
      res.cookie("refresh_token", refreshToken, refreshCookieOptions());

      return res.redirect(`${frontendUrl}/app/auth/callback?success=true`);
    } catch {
      return res.redirect(`${frontendUrl}/app/auth/callback?error=auth_failed`);
    }
  }
}
