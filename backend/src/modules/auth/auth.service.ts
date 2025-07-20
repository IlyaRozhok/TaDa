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
    private jwtService: JwtService
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

  async googleAuth(googleUser: any) {
    try {
      console.log("🔍 Google Auth service called with user:", googleUser);

      if (!googleUser || !googleUser.email || !googleUser.google_id) {
        throw new BadRequestException("Invalid Google user data");
      }

      const { email, google_id, full_name, avatar_url } = googleUser;

      let user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
        relations: ["tenantProfile", "operatorProfile"],
      });

      let isNewUser = false;

      if (!user) {
        // Create new user with Google OAuth
        user = this.userRepository.create({
          email: email.toLowerCase(),
          google_id,
          full_name: full_name || null,
          avatar_url: avatar_url || null,
          role: "tenant", // Default role
          status: "active",
          // Generate random password for OAuth users
          password: await bcrypt.hash(
            crypto.randomBytes(32).toString("hex"),
            10
          ),
        });

        const savedUser = await this.userRepository.save(user);

        // Create tenant profile by default
        const tenantProfile = this.tenantProfileRepository.create({
          user: savedUser,
          full_name: full_name || null,
        });
        await this.tenantProfileRepository.save(tenantProfile);

        // Create preferences
        const preferences = this.preferencesRepository.create({
          user: savedUser,
        });
        await this.preferencesRepository.save(preferences);

        user = savedUser;
        isNewUser = true;
        console.log("✅ Created new user from Google OAuth:", user.email);
      } else {
        // Update Google ID and other fields if not set
        let shouldUpdate = false;

        if (!user.google_id) {
          user.google_id = google_id;
          shouldUpdate = true;
        }

        if (!user.full_name && full_name) {
          user.full_name = full_name;
          shouldUpdate = true;
        }

        if (!user.avatar_url && avatar_url) {
          user.avatar_url = avatar_url;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          await this.userRepository.save(user);
        }

        console.log("✅ Found existing user for Google OAuth:", user.email);
      }

      // Reload user with all relations
      const fullUser = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });

      if (!fullUser) {
        throw new NotFoundException("User not found after creation/update");
      }

      return { user: fullUser, isNewUser };
    } catch (error) {
      console.error("❌ Error in Google Auth service:", error);
      throw new InternalServerErrorException(
        "Failed to process Google authentication"
      );
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
}
