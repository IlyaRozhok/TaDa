import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  Query,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // Check if user exists
  @Post("check-user")
  @HttpCode(HttpStatus.OK)
  async checkUser(@Body("email") email: string) {
    const exists = await this.authService.checkUserExists(email);
    return { exists };
  }

  // Universal auth endpoint
  @Post("authenticate")
  async authenticate(
    @Body()
    body: {
      email: string;
      password: string;
      role?: "tenant" | "operator";
      rememberMe?: boolean;
    }
  ) {
    const { email, password, role, rememberMe } = body;

    // Check if user exists
    const userExists = await this.authService.checkUserExists(email);

    if (userExists) {
      // User exists - attempt login
      return this.authService.login({ email, password });
    } else {
      // User doesn't exist - check if we have role for registration
      if (!role) {
        return {
          requiresRegistration: true,
          message: "Please select your account type to continue registration",
        };
      }

      // Proceed with registration
      return this.authService.register({
        email,
        password,
        role,
      });
    }
  }

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

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  async invalidateSession(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string
  ) {
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

  // Google OAuth
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      console.log("Google callback - user from strategy:", req.user);

      if (!req.user) {
        console.error("No user data from Google strategy");
        return res.redirect(
          `${process.env.FRONTEND_URL}/app/auth/callback?success=false&error=${encodeURIComponent(
            "Authentication failed"
          )}`
        );
      }

      // Process Google user data through auth service
      const { user, isNewUser } = await this.authService.googleAuth(req.user);
      const tokens = await this.authService.generateTokens(user);

      console.log("Generated tokens for user:", user.email);
      console.log("Redirecting to frontend with token");

      // Redirect with token in query params for frontend to handle
      const callbackUrl = `${process.env.FRONTEND_URL}/app/auth/callback?token=${tokens.access_token}&success=true&isNewUser=${isNewUser}`;
      return res.redirect(callbackUrl);
    } catch (error) {
      console.error("Google callback error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      return res.redirect(
        `${process.env.FRONTEND_URL}/app/auth/callback?success=false&error=${encodeURIComponent(
          errorMessage
        )}`
      );
    }
  }
}
