import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";
import { AuthGuard } from "@nestjs/passport";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return result;
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User, @Req() req: Request) {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await this.authService.logout(user.id, token);
    }
    return { message: "Logged out successfully" };
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.logoutAllDevices(user.id);
    return { message: "Logged out from all devices successfully" };
  }

  @Post("logout-others")
  @UseGuards(JwtAuthGuard)
  async logoutOthers(@CurrentUser() user: User, @Req() req: Request) {
    const currentToken = req.headers.authorization?.split(" ")[1];
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
  async invalidateSession(@CurrentUser() user: User, @Req() req: Request) {
    const sessionId = req.params.sessionId;
    await this.authService.invalidateSession(user.id, sessionId);
    return { message: "Session invalidated successfully" };
  }

  @Post("activity")
  @UseGuards(JwtAuthGuard)
  async updateActivity(@CurrentUser() user: User, @Req() req: Request) {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await this.authService.updateSessionActivity(user.id, token);
    }
    return { message: "Activity updated" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    const fullUser = await this.authService.findUserWithProfile(user.id);
    return {
      user: {
        ...fullUser,
        full_name:
          fullUser.full_name ||
          fullUser.tenantProfile?.full_name ||
          fullUser.operatorProfile?.full_name ||
          null,
      },
    };
  }

  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  async refresh(@CurrentUser() user: User) {
    return this.authService.refresh(user);
  }

  @Post("check-user")
  @HttpCode(HttpStatus.OK)
  async checkUser(@Body("email") email: string) {
    const exists = await this.authService.checkUserExists(email);
    return { exists };
  }

  @Get("test-token")
  @UseGuards(JwtAuthGuard)
  async testToken(@CurrentUser() user: User) {
    return {
      message: "Token is valid",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Google OAuth
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // This endpoint will be handled by Passport Google Strategy
    // The actual logic is in the GoogleStrategy.validate method
    // Passport will automatically redirect to Google OAuth
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // Check for OAuth errors in query params
      if (req.query.error) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const errorUrl = `${frontendUrl}/app/auth/callback?error=oauth_error&details=${req.query.error}`;
        res.redirect(errorUrl);
        return;
      }

      if (!req.user) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const errorUrl = `${frontendUrl}/app/auth/callback?error=no_user_data`;
        res.redirect(errorUrl);
        return;
      }

      const user = await this.authService.googleAuth(req.user);
      const tokens = await this.authService.generateTokens(user);

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const callbackUrl = `${frontendUrl}/app/auth/callback?token=${tokens.accessToken}&success=true`;
      res.redirect(callbackUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const errorUrl = `${frontendUrl}/app/auth/callback?error=auth_failed`;
      res.redirect(errorUrl);
    }
  }

  @Get("google/config-check")
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
      expectedCallbackUrl: callbackURL,
      note: "Проверьте, что GOOGLE_CALLBACK_URL точно совпадает с настройками в Google Cloud Console",
    };
  }
}
