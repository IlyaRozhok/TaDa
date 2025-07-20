import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import {
  AuthService,
  AuthStatus,
  CompleteRegistrationDto,
} from "./auth.service";
import { GoogleUser } from "./strategies/google.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Initiate Google OAuth flow
   * GET /auth/google
   */
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // This will redirect to Google OAuth
    // The actual logic is handled in the strategy
  }

  /**
   * Handle Google OAuth callback
   * GET /auth/google/callback
   */
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const googleUser: GoogleUser = req.user as GoogleUser;

      if (!googleUser) {
        throw new BadRequestException("No user data received from Google");
      }

      // Process the Google user through AuthService
      const result = await this.authService.handleGoogleCallback(googleUser);

      // Redirect based on the result
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      if (result.status === AuthStatus.SUCCESS) {
        // Existing user - redirect with tokens
        const redirectUrl = `${frontendUrl}/auth/success?token=${result.access_token}&refresh_token=${result.refresh_token}`;
        return res.redirect(redirectUrl);
      }

      if (result.status === AuthStatus.NEEDS_ROLE_SELECTION) {
        // New user - redirect to role selection page
        const redirectUrl = `${frontendUrl}/auth/role-selection?registration_id=${result.registration_id}`;
        return res.redirect(redirectUrl);
      }

      // Error case
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(
        result.message || "Authentication failed"
      )}`;
      return res.redirect(errorUrl);
    } catch (error) {
      console.error("❌ Google callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(
        "Authentication failed"
      )}`;
      return res.redirect(errorUrl);
    }
  }

  /**
   * Complete registration with role selection
   * POST /auth/complete-registration
   */
  @Post("complete-registration")
  @HttpCode(HttpStatus.OK)
  async completeRegistration(@Body() dto: CompleteRegistrationDto) {
    // Validate input
    if (!dto.registration_id || !dto.role) {
      throw new BadRequestException("Registration ID and role are required");
    }

    if (!["tenant", "operator"].includes(dto.role)) {
      throw new BadRequestException(
        'Role must be either "tenant" or "operator"'
      );
    }

    const result = await this.authService.completeRegistration(dto);

    if (result.status === AuthStatus.ERROR) {
      throw new BadRequestException(result.message || "Registration failed");
    }

    return result;
  }

  /**
   * Refresh JWT token
   * POST /auth/refresh
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { refresh_token: string }) {
    if (!body.refresh_token) {
      throw new BadRequestException("Refresh token is required");
    }

    const tokens = await this.authService.refreshToken(body.refresh_token);
    return tokens;
  }

  /**
   * Get pending registration statistics (for monitoring)
   * GET /auth/pending-stats
   */
  @Get("pending-stats")
  async getPendingStats() {
    return this.authService.getPendingRegistrationStats();
  }

  /**
   * Health check endpoint
   * GET /auth/health
   */
  @Get("health")
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "auth",
    };
  }
}
