import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    const clientID = configService.get("GOOGLE_CLIENT_ID");
    const clientSecret = configService.get("GOOGLE_CLIENT_SECRET");
    const callbackURL = configService.get("GOOGLE_CALLBACK_URL");

    // Validate environment variables
    if (!clientID) {
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }
    if (!clientSecret) {
      throw new Error("GOOGLE_CLIENT_SECRET is not configured");
    }
    if (!callbackURL) {
      throw new Error("GOOGLE_CALLBACK_URL is not configured");
    }

    console.log("🔍 Google OAuth Strategy initialized with:", {
      clientID: clientID?.substring(0, 20) + "...",
      clientSecret: clientSecret?.substring(0, 10) + "...",
      callbackURL,
    });

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    console.log("🔍 Google OAuth validate called with profile:", {
      id: profile.id,
      displayName: profile.displayName,
      emails: profile.emails,
      photos: profile.photos,
    });

    const { id, name, emails, photos } = profile;

    const user = {
      google_id: id,
      email: emails[0].value,
      full_name: `${name.givenName} ${name.familyName}`,
      avatar_url: photos[0]?.value,
      provider: "google",
      email_verified: true,
      accessToken,
      refreshToken,
    };

    console.log("✅ Google OAuth user data prepared:", {
      google_id: user.google_id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      provider: user.provider,
      email_verified: user.email_verified,
    });

    done(null, user);
  }
}
