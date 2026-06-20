import { Injectable, UnauthorizedException, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { TenantCvService } from "../tenant-cv/tenant-cv.service";
import { AuthTokenService } from "./services/auth-token.service";
import { toUserResponse } from "../users/user.mapper";
import { S3Service } from "../../common/services/s3.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    private authTokenService: AuthTokenService,
    private tenantCvService: TenantCvService,
    private s3Service: S3Service,
  ) {}

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

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = uuidv4();
    const accessToken = this.authTokenService.generateAccessToken(user);
    const refreshToken = this.authTokenService.generateRefreshToken(user, jti);
    await this.authTokenService.createSession(user.id, accessToken, jti);
    return { accessToken, refreshToken };
  }

  async refreshTokens(rawRefreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const verified = this.authTokenService.verifyRefreshToken(rawRefreshToken);
    if (!verified) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const { userId, jti: oldJti } = verified;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.status !== UserStatus.Active) {
      throw new UnauthorizedException("User not found or inactive");
    }

    const rotated = await this.authTokenService.rotateRefreshToken(userId, oldJti);
    if (!rotated) {
      // Token reuse detected — invalidate all sessions as a security measure
      await this.authTokenService.invalidateAllUserTokens(userId);
      throw new UnauthorizedException("Refresh token already used");
    }

    const newJti = uuidv4();
    const accessToken = this.authTokenService.generateAccessToken(user);
    const refreshToken = this.authTokenService.generateRefreshToken(user, newJti);
    await this.authTokenService.createSession(user.id, accessToken, newJti);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  // --- Session management ---

  async logout(userId: string, token: string): Promise<void> {
    await this.authTokenService.invalidateToken(userId, token);
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.authTokenService.invalidateAllUserTokens(userId);
  }

  async logoutOtherDevices(userId: string, currentToken: string): Promise<void> {
    await this.authTokenService.invalidateOtherUserTokens(userId, currentToken);
  }

  async getUserSessions(userId: string) {
    return this.authTokenService.getUserSessions(userId);
  }

  async invalidateSession(userId: string, sessionId: string): Promise<void> {
    await this.authTokenService.invalidateSession(userId, sessionId);
  }

  async updateSessionActivity(userId: string, token: string): Promise<void> {
    await this.authTokenService.updateSessionActivity(userId, token);
  }

  // --- Private helpers ---

  private async createTenantProfile(user: User): Promise<void> {
    const tenantProfile = this.tenantProfileRepository.create({
      userId: user.id,
      full_name: undefined,
      phone: "",
      date_of_birth: undefined,
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
