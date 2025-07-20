import { Injectable, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { TenantProfile } from "./entities/tenant-profile.entity";
import { OperatorProfile } from "./entities/operator-profile.entity";
import { GoogleUser } from "../auth/strategies/google.strategy";
import * as bcrypt from "bcrypt";

export interface CreateUserFromGoogleDto extends GoogleUser {
  role: "tenant" | "operator";
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private readonly tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private readonly operatorProfileRepository: Repository<OperatorProfile>
  ) {}

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ["tenantProfile", "operatorProfile"],
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ["tenantProfile", "operatorProfile"],
    });
  }

  /**
   * Create user from Google OAuth with selected role
   */
  async createFromGoogle(dto: CreateUserFromGoogleDto): Promise<User> {
    try {
      console.log(
        `🔍 Creating user from Google: ${dto.email} with role: ${dto.role}`
      );

      // Check if user already exists
      const existingUser = await this.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException("User already exists");
      }

      // Create user entity
      const user = this.userRepository.create({
        email: dto.email.toLowerCase(),
        full_name: dto.full_name,
        google_id: dto.google_id,
        avatar_url: dto.avatar_url,
        role: dto.role,
        email_verified: dto.email_verified,
        status: "active",
        // Generate a random password for OAuth users (they won't use it)
        password: await bcrypt.hash(crypto.randomUUID(), 10),
      });

      // Save user
      const savedUser = await this.userRepository.save(user);
      console.log(
        `✅ Created user: ${savedUser.email} with ID: ${savedUser.id}`
      );

      // Create role-specific profile
      if (dto.role === "tenant") {
        await this.createTenantProfile(savedUser);
      } else if (dto.role === "operator") {
        await this.createOperatorProfile(savedUser);
      }

      // Return user with relations
      return this.findById(savedUser.id);
    } catch (error) {
      console.error(`❌ Error creating user from Google:`, error);
      throw error;
    }
  }

  /**
   * Update Google ID for existing user
   */
  async updateGoogleId(userId: string, googleId: string): Promise<void> {
    await this.userRepository.update(userId, { google_id: googleId });
    console.log(`✅ Updated Google ID for user: ${userId}`);
  }

  /**
   * Create tenant profile and preferences
   */
  private async createTenantProfile(user: User): Promise<void> {
    const tenantProfile = this.tenantProfileRepository.create({
      user,
      // Add default tenant-specific fields here
      looking_for_property: true,
      budget_min: null,
      budget_max: null,
      preferred_locations: [],
    });

    await this.tenantProfileRepository.save(tenantProfile);
    console.log(`✅ Created tenant profile for user: ${user.id}`);

    // You can also create preferences entity here if needed
    // const preferences = this.preferencesRepository.create({ user });
    // await this.preferencesRepository.save(preferences);
  }

  /**
   * Create operator profile
   */
  private async createOperatorProfile(user: User): Promise<void> {
    const operatorProfile = this.operatorProfileRepository.create({
      user,
      // Add default operator-specific fields here
      company_name: null,
      license_number: null,
      properties_managed: 0,
      verified: false,
    });

    await this.operatorProfileRepository.save(operatorProfile);
    console.log(`✅ Created operator profile for user: ${user.id}`);
  }

  /**
   * Get user with full profile data
   */
  async getUserWithProfile(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: [
        "tenantProfile",
        "operatorProfile",
        "tenantProfile.preferences", // if you have nested relations
      ],
    });
  }

  /**
   * Update user profile data
   */
  async updateProfile(
    userId: string,
    profileData: Partial<User>
  ): Promise<User> {
    await this.userRepository.update(userId, profileData);
    return this.findById(userId);
  }
}
