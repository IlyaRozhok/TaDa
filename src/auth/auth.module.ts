import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

// Controllers
import { AuthController } from "./auth.controller";

// Services
import { AuthService } from "./auth.service";
import { PendingRegistrationService } from "./services/pending-registration.service";

// Strategies
import { GoogleStrategy } from "./strategies/google.strategy";

// Entities (assuming these exist in your user module)
import { User } from "../user/entities/user.entity";
import { TenantProfile } from "../user/entities/tenant-profile.entity";
import { OperatorProfile } from "../user/entities/operator-profile.entity";

// User module
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    // Import other modules
    UserModule,
    ConfigModule,

    // Passport setup
    PassportModule.register({ defaultStrategy: "google" }),

    // JWT setup
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN", "1h"),
        },
      }),
      inject: [ConfigService],
    }),

    // TypeORM entities (if not already in UserModule)
    // TypeOrmModule.forFeature([User, TenantProfile, OperatorProfile]),
  ],
  controllers: [AuthController],
  providers: [AuthService, PendingRegistrationService, GoogleStrategy],
  exports: [AuthService, PendingRegistrationService, JwtModule],
})
export class AuthModule {}
