import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { PendingRegistrationService } from "./services/pending-registration.service";
import { GoogleUser } from "./strategies/google.strategy";

export enum AuthStatus {
  SUCCESS = "SUCCESS",
  NEEDS_ROLE_SELECTION = "NEEDS_ROLE_SELECTION",
  ERROR = "ERROR",
}

export interface AuthResponse {
  status: AuthStatus;
  access_token?: string;
  refresh_token?: string;
  user?: any;
  registration_id?: string;
  message?: string;
}

export interface CompleteRegistrationDto {
  registration_id: string;
  role: "tenant" | "operator";
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly pendingRegistrationService: PendingRegistrationService
  ) {}

  /**
   * Handle Google OAuth callback
   * Returns different responses based on user existence
   */
  async handleGoogleCallback(googleUser: GoogleUser): Promise<AuthResponse> {
    try {
      console.log(`🔍 Processing Google OAuth for: ${googleUser.email}`);

      // Check if user already exists
      const existingUser = await this.userService.findByEmail(googleUser.email);

      if (existingUser) {
        console.log(`✅ Found existing user: ${existingUser.email}`);

        // Update Google ID if not set
        if (!existingUser.google_id) {
          await this.userService.updateGoogleId(
            existingUser.id,
            googleUser.google_id
          );
        }

        // Generate tokens for existing user
        const tokens = await this.generateTokens(existingUser);

        return {
          status: AuthStatus.SUCCESS,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          user: this.sanitizeUser(existingUser),
        };
      }

      // User doesn't exist - store temporarily and request role selection
      console.log(
        `🔄 New user detected: ${googleUser.email} - requesting role selection`
      );

      const registrationId =
        this.pendingRegistrationService.storePendingRegistration(googleUser);

      return {
        status: AuthStatus.NEEDS_ROLE_SELECTION,
        registration_id: registrationId,
        message: "Please select your role to complete registration",
      };
    } catch (error) {
      console.error(`❌ Google OAuth error for ${googleUser.email}:`, error);
      return {
        status: AuthStatus.ERROR,
        message: "Authentication failed. Please try again.",
      };
    }
  }

  /**
   * Complete registration after role selection
   */
  async completeRegistration(
    dto: CompleteRegistrationDto
  ): Promise<AuthResponse> {
    try {
      console.log(`🔍 Completing registration for: ${dto.registration_id}`);

      // Retrieve pending registration
      const googleUser =
        this.pendingRegistrationService.consumePendingRegistration(
          dto.registration_id
        );

      if (!googleUser) {
        throw new BadRequestException("Invalid or expired registration ID");
      }

      console.log(`✅ Found pending registration for: ${googleUser.email}`);

      // Check if user was created in the meantime
      const existingUser = await this.userService.findByEmail(googleUser.email);
      if (existingUser) {
        console.log(`⚠️ User already exists: ${googleUser.email} - logging in`);
        const tokens = await this.generateTokens(existingUser);
        return {
          status: AuthStatus.SUCCESS,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          user: this.sanitizeUser(existingUser),
        };
      }

      // Create user with selected role
      const newUser = await this.userService.createFromGoogle({
        ...googleUser,
        role: dto.role,
      });

      console.log(
        `✅ Created new user: ${newUser.email} with role: ${newUser.role}`
      );

      // Generate tokens
      const tokens = await this.generateTokens(newUser);

      return {
        status: AuthStatus.SUCCESS,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: this.sanitizeUser(newUser),
      };
    } catch (error) {
      console.error(`❌ Registration completion error:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: AuthStatus.ERROR,
        message: "Failed to complete registration. Please try again.",
      };
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: "1h" }),
      this.jwtService.signAsync(payload, { expiresIn: "7d" }),
    ]);

    return { access_token, refresh_token };
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Verify and refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  /**
   * Get pending registrations stats (for monitoring)
   */
  async getPendingRegistrationStats() {
    return this.pendingRegistrationService.getStats();
  }
}
