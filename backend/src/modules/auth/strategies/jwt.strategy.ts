import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET", "your-secret-key"),
    });
  }

  async validate(payload: any) {
    const { sub: userId } = payload;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences"],
      select: [
        "id",
        "email",
        "full_name",
        "roles",
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
      throw new UnauthorizedException("User not found");
    }

    return user;
  }
}
