import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private readonly configService: ConfigService,
  ) {
    const clientID = configService.get("GOOGLE_CLIENT_ID");
    const clientSecret = configService.get("GOOGLE_CLIENT_SECRET");
    const callbackURL = configService.get("GOOGLE_CALLBACK_URL");

    // Log configuration (without exposing secret)
    console.log("🔍 Google OAuth Configuration:");
    console.log("  - Client ID:", clientID ? `${clientID.substring(0, 10)}...` : "NOT SET");
    console.log("  - Client Secret:", clientSecret ? "SET" : "NOT SET");
    console.log("  - Callback URL:", callbackURL || "NOT SET");

    // Validate environment variables
    if (!clientID) {
      console.error("❌ GOOGLE_CLIENT_ID is not configured");
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }
    if (!clientSecret) {
      console.error("❌ GOOGLE_CLIENT_SECRET is not configured");
      throw new Error("GOOGLE_CLIENT_SECRET is not configured");
    }
    if (!callbackURL) {
      console.error("❌ GOOGLE_CALLBACK_URL is not configured");
      throw new Error("GOOGLE_CALLBACK_URL is not configured");
    }

    console.log("✅ Google OAuth Strategy initialized");

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
    profile: Profile,
    done: VerifyCallback
  ): Promise<any> {
    try {
      console.log("🔍 Google OAuth validate called");
      console.log("  - Profile ID:", profile?.id || "missing");
      console.log("  - Profile emails:", profile?.emails?.length || 0);

      if (!profile || !profile.id) {
        console.error("❌ Invalid profile data from Google");
        return done(new Error("Invalid profile data from Google"), null);
      }

      const { id, name, emails, photos } = profile;

      if (!emails || !emails.length || !emails[0].value) {
        console.error("❌ No email found in Google profile");
        return done(new Error("No email found in Google profile"), null);
      }

      if (!name || (!name.givenName && !name.familyName)) {
        console.error("❌ No name found in Google profile");
        return done(new Error("No name found in Google profile"), null);
      }

      const user = {
        google_id: id,
        email: emails[0].value,
        full_name: `${name.givenName || ""} ${name.familyName || ""}`.trim(),
        avatar_url: photos && photos[0] ? photos[0].value : null,
        provider: "google",
        email_verified: true,
        accessToken,
        refreshToken,
      };

      console.log("✅ Google OAuth user validated:", user.email);
      done(null, user);
    } catch (error) {
      console.error("❌ Google OAuth validate error:", error);
      done(error, null);
    }
  }
}
