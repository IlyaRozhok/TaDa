import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";

import { User } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { Preferences } from "../../entities/preferences.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

export interface AuthResponse {
  access_token: string;
  user: Partial<User>;
}

export interface GoogleUserDto {
  google_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  provider: string;
  email_verified: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, role = "tenant", ...profileData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      role,
      status: "active",
      provider: "local",
      email_verified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Create profile based on role
    if (role === "tenant") {
      const tenantProfile = this.tenantProfileRepository.create({
        userId: savedUser.id,
        full_name: profileData.full_name || "",
        ...profileData,
      });
      await this.tenantProfileRepository.save(tenantProfile);
      savedUser.tenantProfile = tenantProfile;

      // Auto-create empty preferences for tenants
      const preferences = this.preferencesRepository.create({
        user: savedUser,
      });
      const savedPreferences =
        await this.preferencesRepository.save(preferences);
      savedUser.preferences = savedPreferences;
    } else if (role === "operator") {
      const operatorProfile = this.operatorProfileRepository.create({
        userId: savedUser.id,
        full_name: profileData.full_name || "",
        company_name: profileData.company_name,
        phone: profileData.phone,
        business_address: profileData.business_address,
        ...profileData,
      });
      await this.operatorProfileRepository.save(operatorProfile);
      savedUser.operatorProfile = operatorProfile;
    }

    await this.userRepository.save(savedUser);

    return this.generateAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user with password for comparison
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["tenantProfile", "operatorProfile", "preferences"],
      select: [
        "id",
        "email",
        "password",
        "role",
        "status",
        "provider",
        "full_name",
        "avatar_url",
        "email_verified",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if user is OAuth user trying to login with password
    if (user.provider !== "local") {
      throw new UnauthorizedException(
        `This account was created with ${user.provider}. Please use ${user.provider} to sign in.`
      );
    }

    // Check if user has a password (local users should always have a password)
    if (!user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.generateAuthResponse(user);
  }

  async googleAuth(googleUser: GoogleUserDto): Promise<AuthResponse> {
    console.log("🔍 GoogleAuth service called with user:", {
      google_id: googleUser.google_id,
      email: googleUser.email,
      full_name: googleUser.full_name,
      provider: googleUser.provider,
      email_verified: googleUser.email_verified,
    });

    const {
      google_id,
      email,
      full_name,
      avatar_url,
      provider,
      email_verified,
    } = googleUser;

    // Try to find existing user by Google ID first
    console.log("🔍 Looking for existing user by Google ID:", google_id);
    let user = await this.userRepository.findOne({
      where: { google_id },
      relations: ["tenantProfile", "operatorProfile", "preferences"],
    });

    if (!user) {
      console.log(
        "🔍 User not found by Google ID, looking for user by email:",
        email
      );
      // Try to find existing user by email
      user = await this.userRepository.findOne({
        where: { email },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });

      if (user) {
        console.log("🔍 Found existing user by email:", {
          id: user.id,
          email: user.email,
          provider: user.provider,
          google_id: user.google_id,
        });

        // User exists with same email but different provider
        if (user.provider !== "google") {
          console.log("❌ User exists with different provider:", user.provider);
          throw new ConflictException(
            `An account with this email already exists using ${user.provider} authentication. Please sign in with ${user.provider}.`
          );
        }
        // Update Google ID if user exists but doesn't have it
        console.log("🔄 Updating existing Google user with new data");
        user.google_id = google_id;
        user.avatar_url = avatar_url;
        user.email_verified = email_verified;
        await this.userRepository.save(user);
      } else {
        console.log("🆕 Creating new Google OAuth user");
        // Create new user
        user = this.userRepository.create({
          google_id,
          email,
          full_name,
          avatar_url,
          provider,
          email_verified,
          role: "tenant", // Default role for Google OAuth users
          status: "active",
        });

        const savedUser = await this.userRepository.save(user);
        console.log("✅ New user created:", {
          id: savedUser.id,
          email: savedUser.email,
          provider: savedUser.provider,
          role: savedUser.role,
          status: savedUser.status,
        });

        // Create default tenant profile and preferences
        console.log("🔄 Creating tenant profile for new user");
        const tenantProfile = this.tenantProfileRepository.create({
          userId: savedUser.id,
          full_name: full_name || "",
        });
        await this.tenantProfileRepository.save(tenantProfile);
        savedUser.tenantProfile = tenantProfile;

        // Auto-create empty preferences for tenants
        console.log("🔄 Creating preferences for new user");
        const preferences = this.preferencesRepository.create({
          user: savedUser,
        });
        const savedPreferences =
          await this.preferencesRepository.save(preferences);
        savedUser.preferences = savedPreferences;

        await this.userRepository.save(savedUser);

        // Re-fetch user with all relations to ensure everything is properly loaded
        console.log("🔄 Re-fetching user with all relations");
        const completeUser = await this.userRepository.findOne({
          where: { id: savedUser.id },
          relations: ["tenantProfile", "operatorProfile", "preferences"],
        });

        if (!completeUser) {
          console.error("❌ Failed to re-fetch created user");
          throw new Error("Failed to create user properly");
        }

        user = completeUser;
        console.log("✅ New user setup complete:", {
          id: user.id,
          email: user.email,
          role: user.role,
          hasTenantProfile: !!user.tenantProfile,
          hasPreferences: !!user.preferences,
        });
      }
    } else {
      console.log("🔄 Updating existing user found by Google ID:", {
        id: user.id,
        email: user.email,
        provider: user.provider,
      });

      // Update user info from Google
      user.full_name = full_name;
      user.avatar_url = avatar_url;
      user.email_verified = email_verified;
      await this.userRepository.save(user);
      console.log("✅ User updated with fresh Google data");
    }

    console.log("🔄 Generating auth response for user:", {
      id: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider,
    });

    const authResponse = this.generateAuthResponse(user);

    console.log("✅ Google OAuth authentication complete", {
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      has_token: !!authResponse.access_token,
      token_length: authResponse.access_token.length,
    });

    return authResponse;
  }

  private generateAuthResponse(user: User): AuthResponse {
    console.log("🔍 Generating auth response for user:", {
      id: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider,
      status: user.status,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles, // This uses the getter that returns [user.role]
    };

    console.log("🔍 JWT payload:", payload);

    const access_token = this.jwtService.sign(payload);

    console.log("🔍 JWT token generated:", {
      tokenLength: access_token.length,
      tokenStart: access_token.substring(0, 50) + "...",
    });

    // Remove password from user object and add computed fields
    const { password, ...userWithoutPassword } = user;

    // Add computed fields explicitly for frontend
    const userWithComputedFields = {
      ...userWithoutPassword,
      full_name: user.full_name, // Explicitly call getter
      roles: user.roles, // Explicitly call getter
    };

    console.log("✅ Auth response created for user:", {
      user_id: userWithComputedFields.id,
      user_email: userWithComputedFields.email,
      user_role: userWithComputedFields.role,
      has_token: !!access_token,
    });

    return {
      access_token,
      user: userWithComputedFields,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile", "operatorProfile", "preferences"],
      select: [
        "id",
        "email",
        "role",
        "status",
        "provider",
        "full_name",
        "avatar_url",
        "email_verified",
        "created_at",
        "updated_at",
      ],
    });
  }
}
