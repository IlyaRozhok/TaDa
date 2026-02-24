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
import { Throttle } from "@nestjs/throttler";
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
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 5, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);
    
    // Set httpOnly cookies
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return response without tokens (they're now in cookies)
    return {
      user: result.user,
      message: "Registration successful"
    };
  }

  @Post("login")
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 5, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    
    // Set httpOnly cookies
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return response without tokens (they're now in cookies)
    return {
      user: result.user,
      message: "Login successful"
    };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Get token from cookie or header
    const token = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];
    if (token) {
      await this.authService.logout(user.id, token);
    }
    
    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    
    return { message: "Logged out successfully" };
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAllDevices(user.id);
    
    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    
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
    
    // If invalidating current session, clear cookies
    const currentToken = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];
    const sessions = await this.authService.getUserSessions(user.id);
    const currentSession = sessions.find(s => s.token === currentToken);
    
    if (currentSession && currentSession.id === sessionId) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
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
  async refresh(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refresh(user);
    
    // Set new httpOnly cookies
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { message: "Tokens refreshed successfully" };
  }

  @Post("check-user")
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 10, ttl: 10000 }, long: { limit: 20, ttl: 60000 } })
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
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  async googleAuth() {
    // This endpoint will be handled by Passport Google Strategy
    // The actual logic is in the GoogleStrategy.validate method
    // Passport will automatically redirect to Google OAuth
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
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

      // Set httpOnly cookie instead of URL parameter
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      // Pass token in URL so frontend can store it in localStorage (frontend expects token in query)
      const callbackUrl = `${frontendUrl}/app/auth/callback?success=true&token=${encodeURIComponent(tokens.accessToken)}`;
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
