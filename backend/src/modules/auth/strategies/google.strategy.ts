import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = configService.get<string>("GOOGLE_CLIENT_SECRET");
    const callbackURL =
      configService.get<string>("GOOGLE_CALLBACK_URL") ||
      "http://localhost:5001/auth/google/callback";

    if (!clientID || !clientSecret) {
      throw new Error(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google OAuth",
      );
    }

    super({ clientID, clientSecret, callbackURL, scope: ["email", "profile"] });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const email = emails?.[0]?.value;
    if (!email) {
      throw new InternalServerErrorException(
        "Google account did not provide an email address",
      );
    }

    return {
      google_id: id,
      email,
      full_name: `${name.givenName ?? ""} ${name.familyName ?? ""}`.trim(),
      avatar_url: photos?.[0]?.value ?? null,
      email_verified: emails[0].verified ?? false,
    };
  }
}
