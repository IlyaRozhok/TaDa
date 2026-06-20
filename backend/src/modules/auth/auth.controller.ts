import {
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Auth } from "../../common/decorators/auth.decorator";
import { User } from "../../entities/user.entity";
import { AuthGuard } from "@nestjs/passport";

const ACCESS_COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

const REFRESH_COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const isProd = process.env.NODE_ENV === "production";
    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie("access_token", tokens.access_token, ACCESS_COOKIE_OPTIONS(isProd));
    res.cookie("refresh_token", tokens.refresh_token, REFRESH_COOKIE_OPTIONS(isProd));

    return { message: "Tokens refreshed successfully" };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];
    if (token) {
      await this.authService.logout(user.id, token);
    }
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return { message: "Logged out successfully" };
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAllDevices(user.id);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return { message: "Logged out from all devices successfully" };
  }

  @Post("logout-others")
  @UseGuards(JwtAuthGuard)
  async logoutOthers(@CurrentUser() user: User, @Req() req: Request) {
    const currentToken = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];
    if (currentToken) {
      await this.authService.logoutOtherDevices(user.id, currentToken);
    }
    return { message: "Logged out from other devices successfully" };
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: User) {
    const sessions = await this.authService.getUserSessions(user.id);
    return { sessions };
  }

  @Post("sessions/:sessionId/invalidate")
  @UseGuards(JwtAuthGuard)
  async invalidateSession(@CurrentUser() user: User, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.params.sessionId;
    await this.authService.invalidateSession(user.id, sessionId);

    const currentToken = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];
    const sessions = await this.authService.getUserSessions(user.id);
    const currentSession = sessions.find((s) => s.token === currentToken);

    if (currentSession && currentSession.id === sessionId) {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
    }

    return { message: "Session invalidated successfully" };
  }

  @Post("activity")
  @UseGuards(JwtAuthGuard)
  async updateActivity(@CurrentUser() user: User, @Req() req: Request) {
    const token = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];
    if (token) {
      await this.authService.updateSessionActivity(user.id, token);
    }
    return { message: "Activity updated" };
  }

  // --- Google OAuth ---

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  async googleAuth() {
    // Passport redirects to Google — no body needed
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const isProd = process.env.NODE_ENV === "production";

    try {
      if (req.query.error) {
        return res.redirect(`${frontendUrl}/app/auth/callback?error=oauth_error&details=${req.query.error}`);
      }

      if (!req.user) {
        return res.redirect(`${frontendUrl}/app/auth/callback?error=no_user_data`);
      }

      const user = await this.authService.googleAuth(req.user);
      const { accessToken, refreshToken } = await this.authService.generateTokens(user);

      res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS(isProd));
      res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS(isProd));

      return res.redirect(`${frontendUrl}/app/auth/callback?success=true`);
    } catch {
      return res.redirect(`${frontendUrl}/app/auth/callback?error=auth_failed`);
    }
  }

  @Get("google/config-check")
  @Auth("admin")
  async checkGoogleConfig() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    const frontendUrl = process.env.FRONTEND_URL;

    return {
      configured: !!(clientID && clientSecret && callbackURL),
      clientID: clientID ? `${clientID.substring(0, 15)}...` : "NOT SET",
      clientSecret: clientSecret ? "SET" : "NOT SET",
      callbackURL: callbackURL || "NOT SET",
      frontendUrl: frontendUrl || "NOT SET",
    };
  }

  @Get("test-token")
  @Auth("admin")
  async testToken(@CurrentUser() user: User) {
    return { message: "Token is valid", user: { id: user.id, email: user.email, role: user.role } };
  }
}
