import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "../../entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { Preferences } from "../../entities/preferences.entity";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import {
  PendingGoogleRegistrationService,
  GoogleUserData,
} from "./services/pending-google-registration.service";

export interface SessionData {
  id: string;
  token: string;
  deviceInfo?: string;
  lastActivity: Date;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private sessions = new Map<string, SessionData[]>(); // userId -> sessions

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    private jwtService: JwtService,
    private pendingGoogleService: PendingGoogleRegistrationService
  ) {}

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    return !!user;
  }

  async register(registerDto: RegisterDto) {
    const { email, password, role = "tenant" } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      status: "active",
    });

    try {
      const savedUser = await this.userRepository.save(user);

      // Create profile based on role
      if (role === "tenant") {
        const tenantProfile = this.tenantProfileRepository.create({
          user: savedUser,
        });
        await this.tenantProfileRepository.save(tenantProfile);

        // Create preferences for tenant
        const preferences = this.preferencesRepository.create({
          user: savedUser,
        });
        await this.preferencesRepository.save(preferences);
      } else if (role === "operator") {
        const operatorProfile = this.operatorProfileRepository.create({
          user: savedUser,
        });
        await this.operatorProfileRepository.save(operatorProfile);
      }

      // Generate JWT token
      const payload = {
        sub: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      };
      const access_token = this.jwtService.sign(payload);

      // Store session
      const sessionId = uuidv4();
      const sessionData: SessionData = {
        id: sessionId,
        token: access_token,
        lastActivity: new Date(),
        createdAt: new Date(),
      };

      if (!this.sessions.has(savedUser.id)) {
        this.sessions.set(savedUser.id, []);
      }
      this.sessions.get(savedUser.id)!.push(sessionData);

      // Return user without password
      const { password: _, ...userWithoutPassword } = savedUser;
      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw new InternalServerErrorException("Failed to register user");
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email with password
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ["tenantProfile", "operatorProfile"],
      select: [
        "id",
        "email",
        "password",
        "role",
        "status",
        "full_name",
        "provider",
        "google_id",
        "avatar_url",
        "email_verified",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check password
    if (!user.password) {
      throw new UnauthorizedException(
        "This account was created with Google. Please use Google sign-in or contact support to set a password."
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if user is active
    if (user.status !== "active") {
      throw new UnauthorizedException("Account is not active");
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    // Store session
    const sessionId = uuidv4();
    const sessionData: SessionData = {
      id: sessionId,
      token: access_token,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    if (!this.sessions.has(user.id)) {
      this.sessions.set(user.id, []);
    }
    this.sessions.get(user.id)!.push(sessionData);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async logout(userId: string, token: string): Promise<void> {
    const sessions = this.sessions.get(userId);
    if (sessions) {
      const filteredSessions = sessions.filter((s) => s.token !== token);
      this.sessions.set(userId, filteredSessions);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    this.sessions.delete(userId);
  }

  async logoutOtherDevices(
    userId: string,
    currentToken: string
  ): Promise<void> {
    const sessions = this.sessions.get(userId);
    if (sessions) {
      const currentSession = sessions.find((s) => s.token === currentToken);
      this.sessions.set(userId, currentSession ? [currentSession] : []);
    }
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    return this.sessions.get(userId) || [];
  }

  async invalidateSession(userId: string, sessionId: string): Promise<void> {
    const sessions = this.sessions.get(userId);
    if (sessions) {
      const filteredSessions = sessions.filter((s) => s.id !== sessionId);
      this.sessions.set(userId, filteredSessions);
    }
  }

  async updateSessionActivity(userId: string, token: string): Promise<void> {
    const sessions = this.sessions.get(userId);
    if (sessions) {
      const session = sessions.find((s) => s.token === token);
      if (session) {
        session.lastActivity = new Date();
      }
    }
  }

  async findUserWithProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile", "operatorProfile", "preferences"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async refresh(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  async checkGoogleUser(googleUser: any) {
    try {
      console.log("🔍 Checking Google user existence:", googleUser.email);

      if (!googleUser || !googleUser.email || !googleUser.google_id) {
        throw new BadRequestException("Invalid Google user data");
      }

      const { email, google_id, full_name, avatar_url } = googleUser;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });

      if (existingUser) {
        console.log("✅ Found existing user:", existingUser.email);

        // Update Google ID if not set
        if (!existingUser.google_id) {
          existingUser.google_id = google_id;
          await this.userRepository.save(existingUser);
        }

        return { user: existingUser, isNewUser: false };
      }

      // User doesn't exist - return null to indicate new user
      console.log("🔄 New user detected - user doesn't exist yet:", email);
      return { user: null, isNewUser: true, googleData: googleUser };
    } catch (error) {
      console.error("❌ Error checking Google user:", error);
      throw new InternalServerErrorException("Failed to check user");
    }
  }

  async createGoogleUserWithRole(googleData: any, role: "tenant" | "operator") {
    try {
      console.log(
        `🔍 Creating Google user with role: ${role} for ${googleData.email}`
      );

      const { email, google_id, full_name, avatar_url } = googleData;

      // Double-check user doesn't exist
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        console.log("⚠️ User already exists, returning existing user");
        return existingUser;
      }

      // Create user with role
      const user = this.userRepository.create({
        email: email.toLowerCase(),
        google_id,
        full_name: full_name || null,
        avatar_url: avatar_url || null,
        role,
        status: "active",
        // Generate random password for OAuth users
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      });

      const savedUser = await this.userRepository.save(user);
      console.log(`✅ Created user: ${savedUser.email} with role: ${role}`);

      // Create role-specific profiles
      if (role === "tenant") {
        const tenantProfile = this.tenantProfileRepository.create({
          user: savedUser,
        });
        await this.tenantProfileRepository.save(tenantProfile);

        const preferences = this.preferencesRepository.create({
          user: savedUser,
        });
        await this.preferencesRepository.save(preferences);

        console.log(
          `✅ Created tenant profile and preferences for: ${savedUser.email}`
        );
      } else if (role === "operator") {
        const operatorProfile = this.operatorProfileRepository.create({
          user: savedUser,
        });
        await this.operatorProfileRepository.save(operatorProfile);

        console.log(`✅ Created operator profile for: ${savedUser.email}`);
      }

      // Return user with relations
      return await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });
    } catch (error) {
      console.error("❌ Error creating Google user:", error);
      throw new InternalServerErrorException("Failed to create user");
    }
  }

  // Keep the old googleAuth method for backward compatibility but update it
  async googleAuth(googleUser: any) {
    try {
      console.log("🔍 Google Auth service called with user:", googleUser);

      // Use the new method to check user
      const result = await this.checkGoogleUser(googleUser);

      if (result.user) {
        // Existing user - return as before
        return { user: result.user, isNewUser: false };
      } else {
        // New user - we should NOT create them here anymore
        // This is a temporary fallback - we'll change the controller to handle this
        console.log(
          "⚠️ New user detected in googleAuth - this should be handled by the controller now"
        );

        // For now, throw an error to catch this case
        throw new BadRequestException(
          "New user needs role selection - should not reach this point"
        );
      }
    } catch (error) {
      console.error("❌ Google Auth error:", error);
      throw error;
    }
  }

  async setUserRole(userId: string, role: "tenant" | "operator") {
    try {
      console.log(`🔄 Setting role ${role} for user ${userId}`);

      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["tenantProfile", "operatorProfile"],
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      if (user.role) {
        throw new BadRequestException("User already has a role assigned");
      }

      // Set the role
      user.role = role;
      await this.userRepository.save(user);

      // Create appropriate profile
      if (role === "tenant") {
        const tenantProfile = this.tenantProfileRepository.create({
          user: user,
          full_name: user.full_name || null,
        });
        await this.tenantProfileRepository.save(tenantProfile);

        // Create preferences for tenant
        const preferences = this.preferencesRepository.create({
          user: user,
        });
        await this.preferencesRepository.save(preferences);
      } else if (role === "operator") {
        const operatorProfile = this.operatorProfileRepository.create({
          user: user,
          full_name: user.full_name || null,
        });
        await this.operatorProfileRepository.save(operatorProfile);
      }

      console.log(`✅ Successfully set role ${role} for user ${user.email}`);

      // Return updated user with relations
      return await this.userRepository.findOne({
        where: { id: userId },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });
    } catch (error) {
      console.error("Error setting user role:", error);
      throw error;
    }
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile", "operatorProfile"],
    });
  }

  async storeGoogleDataTemporarily(googleData: any): Promise<string> {
    console.log(`🔍 Storing Google data temporarily for: ${googleData.email}`);

    const googleUserData: GoogleUserData = {
      google_id: googleData.google_id,
      email: googleData.email,
      full_name: googleData.full_name,
      avatar_url: googleData.avatar_url,
      email_verified: googleData.email_verified || true,
    };

    return this.pendingGoogleService.storeGoogleData(googleUserData);
  }

  async createGoogleUserFromRegistration(
    registrationId: string,
    role: "tenant" | "operator"
  ) {
    console.log(
      `🔍 Creating Google user from registration: ${registrationId} with role: ${role}`
    );

    // Get Google data from temporary storage
    const googleData =
      this.pendingGoogleService.consumeGoogleData(registrationId);

    if (!googleData) {
      throw new BadRequestException("Invalid or expired registration ID");
    }

    // Create user with role
    const user = await this.createGoogleUserWithRole(googleData, role);

    if (!user) {
      throw new InternalServerErrorException("Failed to create user");
    }

    console.log(
      `✅ Successfully created Google user: ${user.email} with role: ${role}`
    );
    return user;
  }
}
