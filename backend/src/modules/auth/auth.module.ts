import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { User } from "@/entities/user.entity";
import { TenantProfile } from "@/entities/tenant-profile.entity";
import { TenantCvModule } from "@/modules/tenant-cv/tenant-cv.module";
import { accessTokenTtl } from "@/common/config/auth-tokens.config";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TenantProfile]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get("JWT_SECRET");
        if (!secret) {
          throw new Error("JWT_SECRET environment variable is required but not set");
        }
        return {
          secret,
          // Every sign call passes its own `expiresIn`, which wins over this one.
          // It stays as the floor for anything signed without an explicit lifetime.
          signOptions: {
            expiresIn: accessTokenTtl().value,
          },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule,
    TenantCvModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService, JwtStrategy, GoogleStrategy, PassportModule],
})
export class AuthModule {}
