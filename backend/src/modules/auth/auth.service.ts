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
import { Preferences } from "../../entities/preferences.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

export interface AuthResponse {
  access_token: string;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, ...userData } = registerDto;

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
      ...userData,
    });

    const savedUser = await this.userRepository.save(user);

    // Auto-create empty preferences for tenants
    if (!savedUser.is_operator) {
      const preferences = this.preferencesRepository.create({
        user: savedUser,
      });
      const savedPreferences =
        await this.preferencesRepository.save(preferences);

      // Update user with preferences relation
      savedUser.preferences = savedPreferences;
      await this.userRepository.save(savedUser);
    }

    return this.generateAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user with password for comparison
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        "id",
        "email",
        "password",
        "full_name",
        "is_operator",
        "phone",
        "date_of_birth",
        "nationality",
        "age_range",
        "occupation",
        "industry",
        "work_style",
        "lifestyle",
        "pets",
        "smoker",
        "hobbies",
        "ideal_living_environment",
        "additional_info",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      is_operator: user.is_operator,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences"],
      select: [
        "id",
        "email",
        "full_name",
        "is_operator",
        "phone",
        "date_of_birth",
        "nationality",
        "age_range",
        "occupation",
        "industry",
        "work_style",
        "lifestyle",
        "pets",
        "smoker",
        "hobbies",
        "ideal_living_environment",
        "additional_info",
        "created_at",
        "updated_at",
      ],
    });
  }
}
