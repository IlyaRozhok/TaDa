import { Injectable, UnauthorizedException } from "@nestjs/common";

export interface GoogleUser {
  google_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  email_verified: boolean;
}
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { createHash } from "crypto";
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

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role, status: user.status },
        { expiresIn: "15m" },
      ),
      this.jwtService.signAsync(
        { sub: user.id, type: "refresh" },
        { expiresIn: "7d" },
      ),
    ]);

    await this.userRepository.update(
      { id: user.id },
      { refresh_token_hash: this.hashToken(refreshToken) },
    );

    return { accessToken, refreshToken };
  }

  async refreshTokens(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync(rawRefreshToken);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, refresh_token_hash: true },
    });

    if (!user || user.status !== UserStatus.Active) {
      throw new UnauthorizedException("User not found or inactive");
    }

    if (!user.refresh_token_hash || user.refresh_token_hash !== this.hashToken(rawRefreshToken)) {
      throw new UnauthorizedException("Refresh token reuse or invalidation detected");
    }

    return this.generateTokens(user);
  }

  async clearRefreshToken(rawRefreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(rawRefreshToken);
      await this.userRepository.update({ id: payload.sub }, { refresh_token_hash: null });
    } catch {
      // token already invalid — nothing to clear
    }
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

  async googleAuth(googleUser: GoogleUser): Promise<User> {
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

  async findOrCreateFixtureUser(role: "tenant" | "admin" | "fresh-tenant"): Promise<User> {
    // Profile fields must be set so isProfileComplete() returns true in the frontend,
    // which makes SimpleDashboardRouter skip the onboarding redirect for admin users.
    const sharedProfile = {
      first_name: "E2E",
      last_name: role === "admin" ? "Admin" : "Tenant",
      address: "1 Test Street, London",
      phone: "+447700900001",
      date_of_birth: new Date("1990-01-01"),
      nationality: "British",
    };

    const fixtureMap = {
      tenant: { email: "e2e-tenant@tada-test.internal", full_name: "E2E Tenant", dbRole: UserRole.Tenant },
      "fresh-tenant": { email: "e2e-fresh-tenant@tada-test.internal", full_name: "E2E Fresh Tenant", dbRole: UserRole.Tenant },
      admin: { email: "e2e-admin@tada-test.internal", full_name: "E2E Admin", dbRole: UserRole.Admin },
    };

    const fixture = fixtureMap[role];
    let user = await this.userRepository.findOne({ where: { email: fixture.email } });

    if (!user) {
      user = this.userRepository.create({
        email: fixture.email,
        full_name: fixture.full_name,
        email_verified: true,
        provider: "e2e",
        role: fixture.dbRole,
        status: UserStatus.Active,
        ...sharedProfile,
      });
      user = await this.userRepository.save(user);

      if (fixture.dbRole === UserRole.Tenant) {
        await this.createTenantProfile(user);
        await this.tenantCvService.ensureShareUuid(user.id);
      }
    } else {
      // Ensure profile fields are always up-to-date (handles fixtures created before this fix)
      await this.userRepository.update({ id: user.id }, sharedProfile);
      user = (await this.userRepository.findOne({ where: { id: user.id } })) as User;
    }

    if (user.status !== UserStatus.Active) {
      throw new Error(`Fixture user ${fixture.email} is not active`);
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
