import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get("GOOGLE_CLIENT_ID") || "dummy-client-id";
    const clientSecret =
      configService.get("GOOGLE_CLIENT_SECRET") || "dummy-client-secret";
    const callbackURL =
      configService.get("GOOGLE_CALLBACK_URL") ||
      "http://localhost:5001/auth/google/callback";

    // Validate environment variables
    if (!configService.get("GOOGLE_CLIENT_ID")) {
      console.warn(
        "⚠️ GOOGLE_CLIENT_ID is not configured - Google OAuth will be disabled"
      );
    }
    if (!configService.get("GOOGLE_CLIENT_SECRET")) {
      console.warn(
        "⚠️ GOOGLE_CLIENT_SECRET is not configured - Google OAuth will be disabled"
      );
    }
    if (!configService.get("GOOGLE_CALLBACK_URL")) {
      console.warn(
        "⚠️ GOOGLE_CALLBACK_URL is not configured - Google OAuth will be disabled"
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    return {
      google_id: id,
      email: emails[0].value,
      full_name: `${name.givenName} ${name.familyName}`.trim(),
      avatar_url: photos?.[0]?.value ?? null,
      email_verified: emails[0].verified ?? false,
    };
  }

}
