import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { User } from "../../entities/user.entity";
import { Preferences } from "../../entities/preferences.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Preferences]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET", "your-secret-key"),
        signOptions: {
          expiresIn: configService.get("JWT_ACCESS_EXPIRES_IN", "1d"),
        },
      }),
      inject: [ConfigService],
    }),
    // ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, TypeOrmModule],
})
export class AuthModule {}
