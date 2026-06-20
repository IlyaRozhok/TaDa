import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { TenantCvService } from "../tenant-cv/tenant-cv.service";
import { S3Service } from "../../common/services/s3.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    private jwtService: JwtService,
    private tenantCvService: TenantCvService,
    private s3Service: S3Service,
  ) {}

  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, status: user.status },
      { expiresIn: "24h" },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: "refresh" },
      { expiresIn: "7d" },
    );
    return { accessToken, refreshToken };
  }

  async refreshTokens(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(rawRefreshToken);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.Active) {
      throw new UnauthorizedException("User not found or inactive");
    }

    return this.generateTokens(user);
  }

  async findUserWithProfile(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
    });
    if (user?.avatar_url) {
      user.avatar_url = (await this.s3Service.refreshAvatarUrl(user.avatar_url)) ?? user.avatar_url;
    }
    return user;
  }

  async googleAuth(googleUser: any): Promise<User> {
    let user = await this.userRepository.findOne({ where: { google_id: googleUser.google_id } });

    if (!user) {
      user = this.userRepository.create({
        email: googleUser.email.toLowerCase(),
        google_id: googleUser.google_id,
        full_name: googleUser.full_name,
        avatar_url: googleUser.avatar_url,
        email_verified: googleUser.email_verified,
        provider: "google",
        role: UserRole.Tenant,
        status: UserStatus.Active,
      });

      user = await this.userRepository.save(user);
      await this.createTenantProfile(user);
      await this.tenantCvService.ensureShareUuid(user.id);
    } else {
      if (user.status !== UserStatus.Active) {
        throw new UnauthorizedException("Account is suspended or inactive");
      }

      user.full_name = googleUser.full_name;
      user.email_verified = googleUser.email_verified;

      const hasCustomAvatar =
        user.avatar_url &&
        !user.avatar_url.includes("googleusercontent.com") &&
        !user.avatar_url.includes("google.com");

      if (!hasCustomAvatar) {
        user.avatar_url = googleUser.avatar_url;
      }

      user = await this.userRepository.save(user);
    }

    return user;
  }

  private async createTenantProfile(user: User): Promise<void> {
    const tenantProfile = this.tenantProfileRepository.create({
      userId: user.id,
      phone: "",
      nationality: "",
      occupation: "",
      industry: "",
      work_style: "",
      lifestyle: [],
      ideal_living_environment: "",
      additional_info: "",
      shortlisted_properties: [],
    });
    await this.tenantProfileRepository.save(tenantProfile);
  }
}
