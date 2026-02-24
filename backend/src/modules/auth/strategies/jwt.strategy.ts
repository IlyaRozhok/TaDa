import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../entities/user.entity";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    const jwtSecret = configService.get("JWT_SECRET");
    
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required but not set");
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromHeader("x-access-token"),
        // Extract JWT from httpOnly cookie
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    const { sub: userId } = payload;

    if (!userId) {
      throw new UnauthorizedException("Invalid token: no user ID");
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      // Remove select to get all fields
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Ensure the user object has all necessary computed properties
    const userWithComputedFields = {
      ...user,
      roles: user.roles, // This calls the getter
    };

    return userWithComputedFields;
  }
}
