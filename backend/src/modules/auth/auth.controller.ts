import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: "Registration successful",
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({ status: 200, description: "User successfully logged in" })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: "Login successful",
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Initiate Google OAuth login" })
  @ApiResponse({ status: 200, description: "Redirects to Google OAuth" })
  async googleAuth() {
    // This endpoint initiates Google OAuth flow
    // The actual logic is handled by the GoogleStrategy
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Handle Google OAuth callback" })
  @ApiResponse({ status: 200, description: "Google OAuth callback handled" })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      console.log("🔍 Google OAuth callback received");
      const googleUser = req.user as any;

      console.log("🔍 Google user data from request:", {
        google_id: googleUser?.google_id,
        email: googleUser?.email,
        full_name: googleUser?.full_name,
        provider: googleUser?.provider,
        email_verified: googleUser?.email_verified,
      });

      const result = await this.authService.googleAuth(googleUser);

      console.log("✅ Google OAuth authentication successful", {
        user_id: result.user.id,
        user_email: result.user.email,
        user_role: result.user.role,
        has_token: !!result.access_token,
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = `${frontendUrl}/app/auth/callback?token=${result.access_token}&success=true`;

      console.log("🔄 Redirecting to frontend:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = `${frontendUrl}/app/auth/callback?error=${encodeURIComponent(error.message)}`;

      console.log("🔄 Redirecting to frontend with error:", redirectUrl);
      res.redirect(redirectUrl);
    }
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Current user profile" })
  async getProfile(@Req() req: Request, @CurrentUser() user: any) {
    console.log("🔍 /auth/me endpoint called");

    // Use both req.user and @CurrentUser() for debugging
    const requestUser = (req as any).user;

    console.log("🔍 User sources:", {
      fromDecorator: {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        exists: !!user,
      },
      fromRequest: {
        id: requestUser?.id,
        email: requestUser?.email,
        role: requestUser?.role,
        exists: !!requestUser,
      },
    });

    // Use whichever source provides the user
    const finalUser = user || requestUser;

    if (!finalUser) {
      console.error("❌ No user found from any source");
      throw new UnauthorizedException("Authentication failed");
    }

    // Ensure computed fields are included
    const userWithComputedFields = {
      ...finalUser,
      roles: finalUser.roles, // This calls the getter
    };

    console.log("✅ Returning user profile:", {
      id: userWithComputedFields.id,
      email: userWithComputedFields.email,
      role: userWithComputedFields.role,
      full_name: userWithComputedFields.full_name,
      hasRoles: !!userWithComputedFields.roles,
    });

    return { user: userWithComputedFields };
  }
}
